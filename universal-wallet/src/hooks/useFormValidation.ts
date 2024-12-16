// hooks/useFormValidation.ts
import { useContext } from 'react';
import { MessageContext } from '../context/UserMessage.context';

interface LoginForm {
  nickname: string;
  password: string;
  passwordConfirmation: string;
  checked: boolean;
}

export const useFormValidation = () => {
  const { setShowMessage, setMessageInfo } = useContext(MessageContext);

  const isValidInput = (value: string): boolean => {
    const regex = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/;
    return !regex.test(value);
  };

  const isStrongPassword = (password: string): boolean => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
    return regex.test(password);
  };

  const validateForm = (form: LoginForm): { err?: string } => {
    if (!form.nickname.trim()) {
      return { err: 'Nickname is required!' };
    }

    if (form.nickname.length < 3 || form.nickname.length > 15) {
      return { err: 'Nickname must be between 3 and 15 characters!' };
    }

    if (!form.password) {
      return { err: 'Password is required!' };
    }

    if (!isStrongPassword(form.password)) {
      return {
        err: 'Password must be at least 8 characters long and include an uppercase letter, lowercase letter, number, and special character!',
      };
    }

    if (form.password !== form.passwordConfirmation) {
      return { err: 'Passwords do not match!' };
    }

    if (!form.checked) {
      return { err: 'You must accept the terms and conditions!' };
    }

    return {};
  };

  return { validateForm, isValidInput, isStrongPassword, setShowMessage, setMessageInfo };
};