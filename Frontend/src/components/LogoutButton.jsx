import React from 'react'
import { useAuthStore } from '../store/useAuthStore'

const LogoutButton = ({children}) => {
    const {logout} = useAuthStore();

    // const onLogout = async () => {await logout()};
  return (
    <div className='btn btn-primary' onClick={logout}>
        {children}
    </div>
  )
}

export default LogoutButton