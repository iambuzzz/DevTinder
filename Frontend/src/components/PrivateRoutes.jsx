import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const PrivateRoutes = () => {
  const user = useSelector((store) => store.user);
  return user ? <Outlet /> : <Navigate to="/home" replace />;
};

export default PrivateRoutes;
