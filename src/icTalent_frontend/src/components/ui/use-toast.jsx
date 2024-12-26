import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const useToast = () => {
  const notify = ({ title, description, variant = "default" }) => {
    toast(
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm">{description}</div>
      </div>,
      {
        type: variant === "destructive" ? "error" : "success",
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  };

  return { notify };
};

export const ToastProvider = () => (
  <ToastContainer
    position="top-right"
    autoClose={5000}
    hideProgressBar={false}
  />
);
