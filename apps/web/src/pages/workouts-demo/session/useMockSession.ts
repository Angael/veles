import { useState } from 'react';
import { initialSession, makeSet, mockId, type MockSet, type MockSlot } from '../mockData';

export type SessionActions = ReturnType<typeof useMockSession>['actions'];

/** In-memory stand-in for the future session mutations; every action maps to one server call. */
export function useMockSession() {
  const [slots, setSlots] = useState<MockSlot[]>(initialSession);

  const updateSlot = (slotId: string, update: (slot: MockSlot) => MockSlot) =>
    setSlots((current) => current.map((slot) => (slot.id === slotId ? update(slot) : slot)));

  const updateSet = (slotId: string, setId: string, patch: Partial<MockSet>) =>
    updateSlot(slotId, (slot) => ({
      ...slot,
      sets: slot.sets.map((set) => (set.id === setId ? { ...set, ...patch } : set)),
    }));

  const actions = {
    addSlot: (name: string, measure: MockSlot['measure']) =>
      setSlots((current) => [
        ...current,
        {
          id: mockId(),
          measure,
          name,
          note: '',
          restSeconds: 90,
          sets: [makeSet()],
        },
      ]),
    /** New set copies the last one's values, the way people actually progress through sets. */
    addSet: (slotId: string) =>
      updateSlot(slotId, (slot) => {
        const last = slot.sets.at(-1);
        const copy = last
          ? { ...last, done: false, id: mockId(), previous: null, type: last.type }
          : makeSet();
        return { ...slot, sets: [...slot.sets, copy] };
      }),
    duplicateSet: (slotId: string, setId: string) =>
      updateSlot(slotId, (slot) => {
        const index = slot.sets.findIndex((set) => set.id === setId);
        const source = slot.sets[index];
        if (!source) return slot;
        const sets = [...slot.sets];
        sets.splice(index + 1, 0, { ...source, done: false, id: mockId() });
        return { ...slot, sets };
      }),
    moveSlot: (slotId: string, delta: -1 | 1) =>
      setSlots((current) => {
        const index = current.findIndex((slot) => slot.id === slotId);
        const target = index + delta;
        if (index < 0 || target < 0 || target >= current.length) return current;
        const next = [...current];
        [next[index], next[target]] = [next[target] as MockSlot, next[index] as MockSlot];
        return next;
      }),
    removeSet: (slotId: string, setId: string) =>
      updateSlot(slotId, (slot) => ({
        ...slot,
        sets: slot.sets.filter((set) => set.id !== setId),
      })),
    removeSlot: (slotId: string) =>
      setSlots((current) => current.filter((slot) => slot.id !== slotId)),
    updateSet,
    updateSlot: (slotId: string, patch: Partial<MockSlot>) =>
      updateSlot(slotId, (slot) => ({ ...slot, ...patch })),
  };

  return { actions, slots };
}
