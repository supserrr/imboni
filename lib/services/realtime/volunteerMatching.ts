/**
 * Volunteer matching service.
 * Finds best volunteer based on availability, load balancing, and location/proximity.
 */

import { supabase } from '@/lib/supabase';
import { debug, info, error as logError, warn } from '@/lib/utils/logger';
import * as Notifications from 'expo-notifications';

/**
 * Volunteer match result.
 */
export interface VolunteerMatch {
  id: string;
  email: string;
  full_name: string;
  latitude: number;
  longitude: number;
  active_calls_count: number;
  distance_km: number;
}

/**
 * Call request result.
 */
export interface CallRequestResult {
  callRequestId: string;
  volunteer: VolunteerMatch | null;
  status: 'pending' | 'active' | 'cancelled';
}

/**
 * Finds the best volunteer based on location and availability.
 *
 * @param userLatitude - User's latitude
 * @param userLongitude - User's longitude
 * @returns Best volunteer match or null if none available
 */
export async function findBestVolunteer(
  userLatitude: number,
  userLongitude: number
): Promise<VolunteerMatch | null> {
  try {
    // Call Supabase function to find best volunteer
    const { data, error } = await supabase.rpc('find_best_volunteer', {
      user_lat: userLatitude,
      user_lng: userLongitude,
    });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      debug('No volunteers available', { userLatitude, userLongitude });
      return null;
    }

    const match = data[0] as VolunteerMatch;
    info('Found volunteer match', {
      volunteerId: match.id,
      distanceKm: match.distance_km,
      activeCalls: match.active_calls_count,
    });

    return match;
  } catch (err) {
    logError('Failed to find volunteer', err instanceof Error ? err : new Error(String(err)), {
      userLatitude,
      userLongitude,
    });
    return null;
  }
}

/**
 * Creates a call request and notifies volunteer.
 *
 * @param userId - User ID
 * @param volunteerId - Volunteer ID
 * @param userLatitude - User's latitude (optional)
 * @param userLongitude - User's longitude (optional)
 * @returns Call request result
 */
export async function createCallRequest(
  userId: string,
  volunteerId: string,
  userLatitude?: number,
  userLongitude?: number
): Promise<CallRequestResult> {
  try {
    // Create call request
    const { data, error } = await supabase
      .from('call_requests')
      .insert({
        user_id: userId,
        volunteer_id: volunteerId,
        status: 'pending',
        user_latitude: userLatitude,
        user_longitude: userLongitude,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Get volunteer info for notification
    const { data: volunteerData, error: volunteerError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', volunteerId)
      .single();

    if (volunteerError) {
      warn('Failed to fetch volunteer info for notification', { error: volunteerError });
    }

    // Send notification to volunteer via Supabase (or use expo-notifications for push)
    // For now, we'll use Supabase Realtime subscriptions which are already set up
    // Push notifications would require additional setup with expo-notifications

    info('Call request created', {
      callRequestId: data.id,
      userId,
      volunteerId,
    });

    return {
      callRequestId: data.id,
      volunteer: volunteerData
        ? {
            id: volunteerData.id,
            email: volunteerData.email || '',
            full_name: volunteerData.full_name || '',
            latitude: 0,
            longitude: 0,
            active_calls_count: 0,
            distance_km: 0,
          }
        : null,
      status: data.status as 'pending' | 'active' | 'cancelled',
    };
  } catch (err) {
    logError('Failed to create call request', err instanceof Error ? err : new Error(String(err)), {
      userId,
      volunteerId,
    });
    throw err;
  }
}

/**
 * Searches for volunteers with retry logic.
 * Tries up to maxAttempts times to find an available volunteer.
 *
 * @param userId - User ID
 * @param userLatitude - User's latitude
 * @param userLongitude - User's longitude
 * @param maxAttempts - Maximum search attempts (default 3)
 * @param onMatch - Callback when volunteer is found
 * @param onNoMatch - Callback when no volunteer is found after all attempts
 * @returns Promise that resolves with call request result or null
 */
export async function searchVolunteer(
  userId: string,
  userLatitude: number,
  userLongitude: number,
  maxAttempts: number = 3,
  onMatch?: (match: VolunteerMatch) => void,
  onNoMatch?: () => void
): Promise<CallRequestResult | null> {
  let attempts = 0;
  const attemptedVolunteerIds: Set<string> = new Set();

  while (attempts < maxAttempts) {
    attempts += 1;

    // Find best volunteer
    const volunteer = await findBestVolunteer(userLatitude, userLongitude);

    if (!volunteer) {
      if (attempts === maxAttempts) {
        // No volunteers available after all attempts
        info('No volunteers available after all attempts', { attempts });
        if (onNoMatch) {
          onNoMatch();
        }
        return null;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
      continue;
    }

    // Skip if we've already tried this volunteer
    if (attemptedVolunteerIds.has(volunteer.id)) {
      if (attempts === maxAttempts) {
        info('All available volunteers already attempted', { attempts });
        if (onNoMatch) {
          onNoMatch();
        }
        return null;
      }
      continue;
    }

    attemptedVolunteerIds.add(volunteer.id);

    // Notify match found
    if (onMatch) {
      onMatch(volunteer);
    }

    try {
      // Create call request
      const result = await createCallRequest(userId, volunteer.id, userLatitude, userLongitude);

      // Subscribe to call request updates via Supabase Realtime
      const subscription = supabase
        .channel(`call_request_${result.callRequestId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'call_requests',
            filter: `id=eq.${result.callRequestId}`,
          },
          (payload) => {
            const updatedStatus = (payload.new as { status: string }).status;
            debug('Call request status updated', {
              callRequestId: result.callRequestId,
              status: updatedStatus,
            });

            if (updatedStatus === 'active') {
              // Volunteer accepted, proceed with call
              subscription.unsubscribe();
              return;
            }

            if (updatedStatus === 'cancelled' || updatedStatus === 'declined') {
              // Volunteer declined, try next volunteer
              subscription.unsubscribe();
              
              // Continue search
              searchVolunteer(
                userId,
                userLatitude,
                userLongitude,
                maxAttempts - attempts,
                onMatch,
                onNoMatch
              ).catch((err) => {
                logError('Error in volunteer search continuation', err instanceof Error ? err : new Error(String(err)));
              });
            }
          }
        )
        .subscribe();

      return result;
    } catch (err) {
      logError('Failed to create call request for volunteer', err instanceof Error ? err : new Error(String(err)), {
        volunteerId: volunteer.id,
        attempt: attempts,
      });

      // Continue to next attempt
      if (attempts === maxAttempts) {
        if (onNoMatch) {
          onNoMatch();
        }
        return null;
      }
    }
  }

  return null;
}

