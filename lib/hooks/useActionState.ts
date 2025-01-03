import { useState } from 'react';

export function useActionState<TState, TFormData>(
  action: (prevState: TState, formData: TFormData) => Promise<TState>,
  initialState: TState
): [TState, (formData: TFormData) => Promise<void>, boolean] {
  const [state, setState] = useState<TState>(initialState);
  const [isPending, setIsPending] = useState(false);

  const formAction = async (formData: TFormData) => {
    setIsPending(true);
    try {
      const newState = await action(state, formData);
      setState(newState);
    } finally {
      setIsPending(false);
    }
  };

  return [state, formAction, isPending];
}
