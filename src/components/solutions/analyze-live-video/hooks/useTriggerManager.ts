"use client"

import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { CustomTriggerFormState, Trigger, TriggerConfig } from '../player-types';

const STORAGE_KEY = 'moondream-custom-triggers';

interface UseTriggerManagerParams {
  predefinedTriggers: Trigger[];
}

export interface TriggerManagerState {
  query1: string;
  selectedTriggerId: string;
  predefinedTriggers: Trigger[];
  customTriggers: Trigger[];
  isCustomModalOpen: boolean;
  customTriggerForm: CustomTriggerFormState;
}

export interface TriggerManagerActions {
  setQuery1: (value: string) => void;
  handleTriggerChange: (value: string) => void;
  setIsCustomModalOpen: (open: boolean) => void;
  setCustomTriggerForm: Dispatch<SetStateAction<CustomTriggerFormState>>;
  createCustomTrigger: () => void;
}

export interface UseTriggerManagerResult {
  state: TriggerManagerState;
  actions: TriggerManagerActions;
  config: TriggerConfig;
}

export function useTriggerManager({ predefinedTriggers }: UseTriggerManagerParams): UseTriggerManagerResult {
  const [query1, setQuery1] = useState('');
  const [query2, setQuery2] = useState(predefinedTriggers[0]?.query ?? '');
  const [triggerText, setTriggerText] = useState(predefinedTriggers[0]?.triggerText ?? '');
  const [notificationText, setNotificationText] = useState(predefinedTriggers[0]?.notificationText ?? '');

  const [customTriggers, setCustomTriggers] = useState<Trigger[]>([]);
  const [selectedTriggerId, setSelectedTriggerId] = useState(predefinedTriggers[0]?.id ?? '');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customTriggerForm, setCustomTriggerForm] = useState<CustomTriggerFormState>({
    name: '',
    query: '',
    triggerText: '',
    notificationText: '',
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCustomTriggers(JSON.parse(stored));
      }
    } catch (storageError) {
      console.error('Error loading custom triggers', storageError);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customTriggers));
    } catch (storageError) {
      console.error('Error saving custom triggers', storageError);
    }
  }, [customTriggers]);

  const allTriggers = useMemo(() => [...predefinedTriggers, ...customTriggers], [predefinedTriggers, customTriggers]);

  useEffect(() => {
    const selectedTrigger = allTriggers.find(trigger => trigger.id === selectedTriggerId);
    if (selectedTrigger) {
      setQuery2(selectedTrigger.query);
      setTriggerText(selectedTrigger.triggerText);
      setNotificationText(selectedTrigger.notificationText);
    }
  }, [selectedTriggerId, allTriggers]);

  const handleTriggerChange = useCallback((value: string) => {
    if (value === 'custom') {
      setIsCustomModalOpen(true);
      return;
    }
    setSelectedTriggerId(value);
  }, []);

  const createCustomTrigger = useCallback(() => {
    if (!customTriggerForm.name || !customTriggerForm.query || !customTriggerForm.triggerText || !customTriggerForm.notificationText) {
      return;
    }

    const newTrigger: Trigger = {
      id: `custom-${Date.now()}`,
      name: customTriggerForm.name,
      query: customTriggerForm.query,
      triggerText: customTriggerForm.triggerText,
      notificationText: customTriggerForm.notificationText,
    };

    setCustomTriggers(prev => [...prev, newTrigger]);
    setSelectedTriggerId(newTrigger.id);
    setIsCustomModalOpen(false);
    setCustomTriggerForm({ name: '', query: '', triggerText: '', notificationText: '' });
  }, [customTriggerForm]);

  return {
    state: {
      query1,
      selectedTriggerId,
      predefinedTriggers,
      customTriggers,
      isCustomModalOpen,
      customTriggerForm,
    },
    actions: {
      setQuery1,
      handleTriggerChange,
      setIsCustomModalOpen,
      setCustomTriggerForm,
      createCustomTrigger,
    },
    config: {
      query1,
      query2,
      triggerText,
      notificationText,
    },
  };
}

