import { configureStore } from "@reduxjs/toolkit";
import RootState from "../state/root";

export const store = configureStore({
  reducer: RootState.reducer,
});

export type RootStore = typeof store;
export type RootDispatch = RootStore["dispatch"];

export type StateChangeListener<T> =
  (newValue: T, oldValue: T) => (() => void) | void;

(function () {
  let oldState = store.getState();
  store.subscribe(() => {
    const newState = store.getState();
    ChangeSubscriber.dispatchChange(oldState, newState);
    oldState = newState;
  });
})();

export function subscribeToChange<T>(args: {
  selector: (state: RootState) => T,
  equals: (a: T, b: T) => boolean,
  onChange: StateChangeListener<T>,
}): () => void {
  const { selector, equals, onChange } = args;
  const subscriber = new ChangeSubscriber({ selector, equals, onChange });
  return () => subscriber.destroy();
}

interface GenericChangeSubscriber {
  handleChange(oldState: RootState, newState: RootState): void;
}

const CHANGE_SUBSCRIBERS = new Set<GenericChangeSubscriber>();
class ChangeSubscriber<T> implements GenericChangeSubscriber {

  private readonly selector: (state: RootState) => T;
  private readonly equals: (a: T, b: T) => boolean;
  private readonly onChange: StateChangeListener<T>;
  private cancelOnChange: (() => void) | void = undefined;

  constructor(args: {
    selector: (state: RootState) => T,
    equals: (a: T, b: T) => boolean,
    onChange: StateChangeListener<T>,
  }) {
    this.selector = args.selector;
    this.equals = args.equals;
    this.onChange = args.onChange;

    CHANGE_SUBSCRIBERS.add(this);
  }

  public handleChange(oldState: RootState, newState: RootState) {
    if (this.cancelOnChange) {
      this.cancelOnChange();
      this.cancelOnChange = undefined
    }

    const oldValue = this.selector(oldState);
    const newValue = this.selector(newState);
    if (!this.equals(oldValue, newValue)) {
      this.cancelOnChange = this.onChange(newValue, oldValue);
    }
  }

  public static dispatchChange(oldState: RootState, newState: RootState) {
    for (const subscriber of CHANGE_SUBSCRIBERS) {
      subscriber.handleChange(oldState, newState);
    }
  }

  public destroy() {
    CHANGE_SUBSCRIBERS.delete(this);
  }
}
