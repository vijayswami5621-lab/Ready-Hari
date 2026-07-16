import { useNavigate } from "react-router-dom";

export const useGoBack = () => {
  const navigate = useNavigate();
  return (fallback: string | any = "/") => {
    const finalFallback = typeof fallback === 'string' ? fallback : "/";
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(finalFallback, { replace: true });
    }
  };
};
