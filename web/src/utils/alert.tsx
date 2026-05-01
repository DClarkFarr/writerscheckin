import type { ReactNode } from "react";
import { toast, type ToastOptions } from "react-toastify";
import { AlertBody } from "../components/helpers/AlertBody";

const TIMEOUT_DEFAULT = 3000;
const TIMEOUT_ERROR = 5000;

type AlertOptions = ToastOptions<unknown> & {
  icon?: ReactNode;
};
export const alert = {
  success: (message: ReactNode, { icon, ...options }: AlertOptions = {}) => {
    toast.success(<AlertBody icon={icon}>{message}</AlertBody>, {
      position: "top-right",
      autoClose: TIMEOUT_DEFAULT,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: false,
      progress: undefined,
      theme: "light",
      ...options,
    });
  },
  error: (message: ReactNode, { icon, ...options }: AlertOptions = {}) => {
    toast.error(<AlertBody icon={icon}>{message}</AlertBody>, {
      position: "top-right",
      autoClose: TIMEOUT_ERROR,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: false,
      progress: undefined,
      theme: "light",
      ...options,
    });
  },
  info: (message: ReactNode, { icon, ...options }: AlertOptions = {}) => {
    toast.info(<AlertBody icon={icon}>{message}</AlertBody>, {
      position: "top-right",
      autoClose: TIMEOUT_DEFAULT,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: false,
      progress: undefined,
      theme: "light",
      ...options,
    });
  },
  default: (message: ReactNode, { icon, ...options }: AlertOptions = {}) => {
    toast(<AlertBody icon={icon}>{message}</AlertBody>, {
      position: "top-right",
      autoClose: TIMEOUT_DEFAULT,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: false,
      progress: undefined,
      theme: "light",
      ...options,
    });
  },
};
