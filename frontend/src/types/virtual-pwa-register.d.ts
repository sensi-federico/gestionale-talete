declare module "virtual:pwa-register" {
  type RegisterSWOptions = {
    onNeedRefresh?: () => void;
    onRegistered?: (registration?: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (err: unknown) => void;
  };

  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
  export default registerSW;
}
