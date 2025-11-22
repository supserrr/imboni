import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const AGORA_APP_ID = Deno.env.get('AGORA_APP_ID') || '';
const AGORA_APP_CERTIFICATE = Deno.env.get('AGORA_APP_CERTIFICATE') || '';

interface RequestBody {
  userId: string;
  volunteerId: string;
  requestId: string;
}

serve(async (req) => {
  try {
    const { userId, volunteerId, requestId }: RequestBody = await req.json();

    if (!userId || !volunteerId || !requestId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
      return new Response(
        JSON.stringify({ error: 'Agora credentials not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate channel name from request ID
    const channelName = `help_request_${requestId}`;

    // Generate UIDs for both users
    const userUid = parseInt(userId.slice(0, 8), 16) % 2147483647;
    const volunteerUid = parseInt(volunteerId.slice(0, 8), 16) % 2147483647;

    // Generate tokens for both users
    // Note: In production, you should use Agora's token generation library
    // This is a simplified version - you'll need to implement proper token generation
    const userToken = await generateAgoraToken(channelName, userUid);
    const volunteerToken = await generateAgoraToken(channelName, volunteerUid);

    // Return the token for the requesting user (blind user or volunteer)
    // The client will determine which token to use based on their role
    const requestingUserId = req.headers.get('x-user-id') || userId;
    const token = requestingUserId === userId ? userToken : volunteerToken;

    return new Response(
      JSON.stringify({
        token,
        channelName,
        uid: requestingUserId === userId ? userUid : volunteerUid,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating Agora token:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate token' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Generate Agora RTC token
 * Note: This is a simplified version. In production, use Agora's official token generation library
 */
async function generateAgoraToken(
  channelName: string,
  uid: number
): Promise<string> {
  // This is a placeholder - you need to implement proper Agora token generation
  // using the Agora Token Builder library or API
  // For now, return a placeholder token
  // In production, use: https://www.agora.io/en/blog/how-to-build-a-token-for-agora/
  
  const expireTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour expiry
  
  // Simplified token generation (not secure - use proper library in production)
  const tokenData = {
    appId: AGORA_APP_ID,
    channelName,
    uid,
    expireTime,
  };

  // In production, use Agora's token generation library:
  // const token = RtcTokenBuilder.buildTokenWithUid(
  //   AGORA_APP_ID,
  //   AGORA_APP_CERTIFICATE,
  //   channelName,
  //   uid,
  //   RtcRole.PUBLISHER,
  //   expireTime
  // );

  // For now, return a placeholder that the client can use
  // The actual implementation should use Agora's token builder
  return Buffer.from(JSON.stringify(tokenData)).toString('base64');
}

