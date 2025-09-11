// src/modules/posts/components/UserPosts.jsx
import React from 'react';
import { useDispatch } from 'react-redux';
import { Box, Button, IconButton, Tooltip, Chip, Paper, Typography, useMediaQuery } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import * as actions from '../actions';
import PostListItem from './PostListItem';

const UserPosts = ({ userPosts }) => {
  const dispatch = useDispatch();
  const isEs = typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('es');
  const isMobile = useMediaQuery('(max-width:600px)');

  const t = isEs
    ? {
        loading: 'Cargando…',
        prev: 'Anterior',
        next: 'Siguiente',
        page: 'Página',
        goPrev: 'Ir a la página anterior',
        goNext: 'Ir a la página siguiente',
        showing: 'Mostrando',
      }
    : {
        loading: 'Loading…',
        prev: 'Previous',
        next: 'Next',
        page: 'Page',
        goPrev: 'Go to previous page',
        goNext: 'Go to next page',
        showing: 'Showing',
      };

  if (!userPosts || !userPosts.result || !Array.isArray(userPosts.result.items)) {
    return <div>{t.loading}</div>;
  }

  const { criteria, result } = userPosts;
  const { items, existMoreItems } = result;

  const handlePrev = () => {
    if (criteria.page > 0) {
      dispatch(actions.previousGetUserPosts(criteria));
    }
  };

  const handleNext = () => {
    if (existMoreItems) {
      dispatch(actions.nextGetUserPosts(criteria));
    }
  };

  const size = items.length || 0;
  const startIndex = criteria.page * size + (size > 0 ? 1 : 0);
  const endIndex = criteria.page * size + size;

  return (
    <Box>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          justifyItems: 'start'
        }}
      >
        {items.map((post) => (
          <PostListItem key={post.id} post={post} />
        ))}
      </div>

      <Paper
        elevation={1}
        sx={{
          mt: 4,
          p: 2,
          borderRadius: 2,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          {size > 0 ? `${t.showing} ${startIndex}–${endIndex}` : `${t.showing} 0`}
        </Typography>

        <Chip
          label={`${t.page} ${criteria.page + 1}`}
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isMobile ? (
            <>
              <Tooltip title={t.goPrev}>
                <span>
                  <IconButton
                    onClick={handlePrev}
                    disabled={criteria.page <= 0}
                    aria-label={t.goPrev}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title={t.goNext}>
                <span>
                  <IconButton
                    onClick={handleNext}
                    disabled={!existMoreItems}
                    aria-label={t.goNext}
                  >
                    <ArrowForwardIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                onClick={handlePrev}
                disabled={criteria.page <= 0}
                startIcon={<ArrowBackIcon />}
              >
                {t.prev}
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!existMoreItems}
                endIcon={<ArrowForwardIcon />}
              >
                {t.next}
              </Button>
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default UserPosts;
