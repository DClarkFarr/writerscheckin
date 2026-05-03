export type BaseQueryOptions = {
  enabled?: boolean;
};

export type RefetchBehaviorOptions = {
  staleTimeMs?: number;
  gcTimeMs?: number;
};

export type MutationLifecycleOptions<TData = unknown> = {
  onSuccess?: (result: TData) => void | Promise<void>;
  onError?: (error: unknown) => void;
};
