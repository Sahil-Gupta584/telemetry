import { Student } from "@/app/lib/schema";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import { Mail, MailX } from "lucide-react";
import { useForm } from "react-hook-form";

type TEmailReminderModel = {
  isEnabled: boolean;
  handle: string;
  name: string;
  email: string;
  userId: string;
  reminderEmailCount: number;
  refetch: () => void;
  onSubmit: (formData: Student, onClose: () => void) => Promise<void>;
};

export function EmailReminderModel({
  handle,
  isEnabled,
  reminderEmailCount,
  name,
  email,
  refetch,
  userId,
  onSubmit,
}: TEmailReminderModel) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<Student>();

  const handleOnSubmit = async (formData: Student) => {
    console.log(formData);
    formData._id = userId;
    formData.isReminderEnabled = !isEnabled;
    await onSubmit(formData, onClose);
  };

  return (
    <>
      <button
        onClick={() => onOpen()}
        className={`p-2 rounded-lg transition-colors duration-200 ${
          isEnabled
            ? "text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
            : "text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
        }`}
        title={isEnabled ? "Disable Auto Reminders" : "Enable Auto Reminders"}
      >
        {isEnabled ? (
          <Mail className="w-4 h-4" />
        ) : (
          <MailX className="w-4 h-4" />
        )}
      </button>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="auto"
        isDismissable={false}
        motionProps={{
          variants: {
            enter: {
              y: 0,
              opacity: 1,
              transition: {
                duration: 0.3,
                ease: "easeOut",
              },
            },
            exit: {
              y: -20,
              opacity: 0,
              transition: {
                duration: 0.2,
                ease: "easeIn",
              },
            },
          },
        }}
        classNames={{
          backdrop:
            "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <form onSubmit={handleSubmit(handleOnSubmit)}>
                <ModalHeader className="flex flex-col gap-1">
                  Update User
                </ModalHeader>
                <ModalBody>
                  <p>
                    Are you Sure for you want to{" "}
                    <strong>{isEnabled ? "Disable" : "Enable"}</strong> email
                    reminder for student:
                  </p>

                  <p>
                    <b>Name :</b> {name}
                  </p>
                  <p>
                    <b>Handle :</b> {handle}
                  </p>
                  <p>
                    <b>Email :</b> {email}
                  </p>
                  <p>
                    <b>reminderSent :</b> {reminderEmailCount}
                  </p>
                </ModalBody>
                <ModalFooter>
                  <Button color="default" variant="flat" onPress={onClose}>
                    Cancel
                  </Button>
                  <Button color="danger" type="submit" isLoading={isSubmitting}>
                    {isEnabled ? "Disable" : "Enable"}
                  </Button>
                </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
