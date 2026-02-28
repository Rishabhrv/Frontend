"use client";

type PopupModalProps = {
  open: boolean;
  type?: "success" | "error";
  title: string;
  message: string;
  onClose: () => void;
};

const PopupModal = ({
  open,
  type = "success",
  title,
  message,
  onClose,
}: PopupModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 animate-scaleIn">
        <h3
          className={`text-lg font-semibold ${
            type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {title}
        </h3>

        <p className="mt-2 text-sm text-gray-600">{message}</p>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 cursor-pointer rounded text-sm text-white ${
              type === "success"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default PopupModal;
