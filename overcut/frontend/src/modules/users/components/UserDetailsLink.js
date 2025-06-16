import React from 'react';
import { useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import { Avatar, Typography, Box } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import * as userSelectors from '../../users/selectors';
const UserDetails = () => {
  const user = useSelector(userSelectors.getUser);

  if (!user) return null;

  return (
      <RouterLink
        to="/users/profile"
        style={{
          textDecoration: 'none',
          color: 'inherit',
          display: 'block',
          padding: '12px 16px',
          borderBottom: '1px solid #ccc',
          backgroundColor: '#f8f8f8'
        }}
      >
        <Box display="flex" alignItems="center">
          <Avatar
            src={user.image ? `data:image/jpg;base64,${user.image}` : null}
            alt={user.userName}
            sx={{ width: 46, height: 46, mr: 2 }}
          />
          <Box>
            <Typography variant="subtitle1" fontWeight={600} color="#000">
              {user.userName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
        </Box>
      </RouterLink>
    );

};

export default UserDetails;
