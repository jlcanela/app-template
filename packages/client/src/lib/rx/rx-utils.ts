import { type Result, type Rx, useRxSetPromise, useRxValue } from "@effect-rx/rx-react";
import { Cause, Exit, identity } from "effect";
import React from "react";

/**
 * @category utilities
 */
export const isResultLoading = <A, E>(result: Result.Result<A, E>) =>
  result.waiting && result._tag === "Initial";

/**
 * Component that atomically subscribes to an Rx value without re-rendering the parent component.
 * Renders its children with the current Rx value as a parameter.
 *
 * @example
 * ```tsx
 * <RxValue rx={someRx}>
 *   {(value) => <div>{value}</div>}
 * </RxValue>
 * ```
 *
 * @category components
 */
export const RxValue = <A>({
  children,
  rx,
}: {
  rx: Rx.Rx<A>;
  children: (value: A) => React.ReactNode;
}) => {
  const value = useRxValue(rx);
  return children(value);
};

/**
 * Hook that provides access to an Rx Result state and a function to execute the action with Promise/Exit semantics.
 * Returns the current result state and a function that returns a Promise resolving to an Exit.
 *
 * @example
 * ```ts
 * const deleteRx = rxRuntime.fn(Effect.fnUntraced(function* (id: string) {
 *   yield* apiClient.delete({ id });
 * }));
 *
 * const [delState, del] = useRxPromise(deleteRx);
 *
 * const exit = await del("item-id");
 * if (exit._tag === "Success") {
 *   // Handle success
 * }
 * ```
 *
 * @category hooks
 */
export const useRxPromise = <E, A, W>(
  rx: Rx.Writable<Result.Result<A, E>, W>,
): [Result.Result<A, E>, (_: W) => Promise<Exit.Exit<A, E>>] => {
  return [useRxValue(rx), useRxSetPromise(rx)];
};

/**
 * Hook that provides access to an Rx Result state and a function to execute the action with throwing Promise semantics.
 * Unlike useRxPromise, the returned function throws on failure, making it compatible with APIs like toast.promise.
 *
 * @example
 * ```ts
 * const deleteRx = rxRuntime.fn(Effect.fnUntraced(function* (id: string) {
 *   yield* apiClient.delete({ id });
 * }));
 *
 * const [delState, del] = useRxPromiseUnwrapped(deleteRx);
 *
 * toast.promise(del("item-id"), {
 *   loading: "Deleting...",
 *   success: "Deleted successfully!",
 *   error: "Failed to delete"
 * });
 * ```
 *
 * @category hooks
 */
export const useRxPromiseUnwrapped = <E, A, W>(
  rx: Rx.Writable<Result.Result<A, E>, W>,
): [Result.Result<A, E>, (_: W) => Promise<A>] => {
  const [result, setPromise] = useRxPromise(rx);

  const setPromiseUnwrapped = React.useCallback(
    (value: W): Promise<A> => {
      return setPromise(value).then(
        Exit.match({
          onSuccess: identity,
          onFailure: (cause) => {
            throw Cause.squash(cause);
          },
        }),
      );
    },
    [setPromise],
  );

  return [result, setPromiseUnwrapped];
};

/**
 * Hook that returns a function to execute an Rx action with throwing Promise semantics.
 * Unlike useRxSetPromise, the returned function throws on failure, making it compatible with APIs like toast.promise.
 *
 * @example
 * ```ts
 * const deleteRx = rxRuntime.fn(Effect.fnUntraced(function* (id: string) {
 *   yield* apiClient.delete({ id });
 * }));
 *
 * const del = useRxSetPromiseUnwrapped(deleteRx);
 *
 * toast.promise(del("item-id"), {
 *   loading: "Deleting...",
 *   success: "Deleted successfully!",
 *   error: "Failed to delete"
 * });
 * ```
 *
 * @category hooks
 */
export const useRxSetPromiseUnwrapped = <E, A, W>(
  rx: Rx.Writable<Result.Result<A, E>, W>,
): ((_: W) => Promise<A>) => {
  const setPromise = useRxSetPromise(rx);

  return React.useCallback(
    (value: W): Promise<A> => {
      return setPromise(value).then(
        Exit.match({
          onSuccess: identity,
          onFailure: (cause) => {
            throw Cause.squash(cause);
          },
        }),
      );
    },
    [setPromise],
  );
};

/**
 * Hook that unwraps a successful Rx Result value and throws if the result is not successful.
 * This is useful when you know the Rx should contain a successful result and want to access the value directly.
 *
 * @example
 * ```ts
 * const userRx = rxRuntime.fn(Effect.fnUntraced(function* () {
 *   return yield* apiClient.getCurrentUser();
 * }));
 *
 * const user = useRxValueUnwrapped(userRx);
 * // user is of type User, not Result<User, E>
 * ```
 *
 * @category hooks
 */
export const useRxValueUnwrapped = <E, A>(rx: Rx.Rx<Result.Result<A, E>>): A => {
  const result = useRxValue(rx);

  if (result._tag === "Success") {
    return result.value;
  }

  throw new Error("[useRxValueUnwrapped] Rx result is not successful");
};
