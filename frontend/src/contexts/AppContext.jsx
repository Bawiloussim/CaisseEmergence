/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import MemberController from '../controllers/MemberController';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const initialMembers = MemberController.getAllMembers() || [];
  const [members] = useState(initialMembers);
  const [currentUserId, setCurrentUserId] = useState(() => (initialMembers[0] ? initialMembers[0].id : null));

  return (
    <AppContext.Provider value={{ currentUserId, setCurrentUserId, members }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);

export default AppContext;
