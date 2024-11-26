import { RTVIClient } from ".";
import { BotNotReadyError } from "./errors";

export function transportReady<T extends RTVIClient>(
  _target: T,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
): PropertyDescriptor | void {
  const originalMethod = descriptor.value;

  descriptor.value = function (this: T, ...args: unknown[]) {
    if (this.state === "ready") {
      return originalMethod.apply(this, args);
    } else {
      throw new BotNotReadyError(
        `Attempt to call ${propertyKey.toString()} when transport not in ready state. Await connect() first.`
      );
    }
  };

  return descriptor;
}
export function transportInState<T extends RTVIClient>(states: string[]) {
  return function (
    _target: T,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor | void {
    const originalMethod = descriptor.value;

    descriptor.get = function (this: T, ...args: unknown[]) {
      if (states.includes(this.state)) {
        return originalMethod.apply(this, args);
      } else {
        throw new BotNotReadyError(
          `Attempt to call ${propertyKey.toString()} when transport not in ${states}.`
        );
      }
    };

    return descriptor;
  };
}

export function getIfTransportInState<T extends RTVIClient>(
  ...states: string[]
) {
  states = ["ready", ...states];

  return function (
    _target: T,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor | void {
    const originalGetter = descriptor.get;

    descriptor.get = function (this: T) {
      if (states.includes(this.state)) {
        return originalGetter?.apply(this);
      } else {
        throw new BotNotReadyError(
          `Attempt to call ${propertyKey.toString()} when transport not in ${states}. Await connect() first.`
        );
      }
    };

    return descriptor;
  };
}
