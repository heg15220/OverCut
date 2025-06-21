import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import * as actions from '../actions';
import {
  Box, Button, Card, CardContent, TextField, MenuItem, Typography, IconButton
} from '@mui/material';
import { Add, Delete, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { FormattedMessage, useIntl } from 'react-intl';

const PostSectionEditor = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [categoryId, setCategoryId] = useState(() => 1); // aseguras tipo number
  const [mainImage, setMainImage] = useState(null);
  const [sections, setSections] = useState([]);
  const intl = useIntl();

  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => setMainImage(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  };

  const handleAddSection = () => {
    const newSection = {
      id: Date.now(),
      title: '',
      blocks: [],
      sectionOrder: sections.length
    };
    setSections([...sections, newSection]);
  };

  const handleAddBlock = (sectionId, type) => {
    setSections(sections.map(section =>
      section.id === sectionId
        ? { ...section, blocks: [...section.blocks, { type, content: '', image: null }] }
        : section
    ));
  };

  const handleBlockChange = (sectionId, blockIndex, field, value) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        const updatedBlocks = section.blocks.map((block, i) =>
          i === blockIndex ? { ...block, [field]: value } : block
        );
        return { ...section, blocks: updatedBlocks };
      }
      return section;
    }));
  };

  const handleImageBlockUpload = (sectionId, blockIndex, e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      handleBlockChange(sectionId, blockIndex, 'image', reader.result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSection = (id) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const handleMove = (index, direction) => {
    const newSections = [...sections];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setSections(newSections.map((s, idx) => ({ ...s, sectionOrder: idx })));
  };

  const handleSectionChange = (id, field, value) => {
    setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSubmit = () => {
    dispatch(actions.createPost(
      { title, subtitle, article: '', categoryId, image: mainImage },
      (postId) => {
        const dtoSections = sections.map((s, idx) => ({
          ...s,
          id: null,
          sectionOrder: idx
        }));
        dispatch(actions.addPostSections(postId, dtoSections, () => {
          navigate('/');
        }));
      },
      (errors) => {
        console.error(errors);
      }
    ));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <FormattedMessage id="postEditor.newPost" defaultMessage="Nuevo Post" />
      </Typography>

      <TextField
        fullWidth
        label={intl.formatMessage({ id: 'postEditor.title', defaultMessage: 'Título' })}
        margin="normal"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />

      <TextField
        fullWidth
        label={intl.formatMessage({ id: 'postEditor.subtitle', defaultMessage: 'Subtítulo' })}
        margin="normal"
        value={subtitle}
        onChange={e => setSubtitle(e.target.value)}
      />

      <TextField
        select
        fullWidth
        label={intl.formatMessage({ id: 'postEditor.category', defaultMessage: 'Categoría' })}
        margin="normal"
        value={categoryId}
        onChange={e => setCategoryId(Number(e.target.value))} // ⚠️ asegura tipo número
      >
        <MenuItem value={1}>News</MenuItem>
        <MenuItem value={4}>Analysis</MenuItem>
      </TextField>


      <Typography variant="subtitle1">
        <FormattedMessage id="postEditor.mainImage" defaultMessage="Imagen principal del post" />
      </Typography>
      <input type="file" accept="image/*" onChange={handleMainImageChange} />

      <Box my={2}>
        <Button onClick={handleAddSection} startIcon={<Add />}>
          <FormattedMessage id="postEditor.addSection" defaultMessage="Añadir subsección" />
        </Button>
      </Box>

      {sections.map((section, index) => (
        <Card key={section.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">
                <FormattedMessage id="postEditor.section" defaultMessage="Sección" /> {index + 1}
              </Typography>
              <Box>
                <IconButton onClick={() => handleMove(index, -1)}><ArrowUpward /></IconButton>
                <IconButton onClick={() => handleMove(index, 1)}><ArrowDownward /></IconButton>
                <IconButton onClick={() => handleRemoveSection(section.id)}><Delete /></IconButton>
              </Box>
            </Box>

            <TextField
              label={intl.formatMessage({ id: 'postEditor.sectionTitle', defaultMessage: 'Título de sección' })}
              fullWidth
              margin="normal"
              value={section.title}
              onChange={e => handleSectionChange(section.id, 'title', e.target.value)}
            />

            <Box my={1}>
              <Button onClick={() => handleAddBlock(section.id, 'text')}>
                <FormattedMessage id="postEditor.addText" defaultMessage="+ Texto" />
              </Button>
              <Button onClick={() => handleAddBlock(section.id, 'image')}>
                <FormattedMessage id="postEditor.addImage" defaultMessage="+ Imagen" />
              </Button>
              <Button onClick={() => handleAddBlock(section.id, 'tweet')}>
                <FormattedMessage id="postEditor.addTweet" defaultMessage="+ Tweet" />
              </Button>
            </Box>

            {section.blocks.map((block, idx) => (
              <Box key={idx} my={1}>
                {block.type === 'text' && (
                  <TextField
                    label={`${intl.formatMessage({ id: 'postEditor.textBlock', defaultMessage: 'Texto' })} ${idx + 1}`}
                    fullWidth
                    multiline
                    rows={4}
                    value={block.content}
                    onChange={e => handleBlockChange(section.id, idx, 'content', e.target.value)}
                  />
                )}
                {block.type === 'image' && (
                  <input type="file" accept="image/*" onChange={e => handleImageBlockUpload(section.id, idx, e)} />
                )}
                {block.type === 'tweet' && (
                  <TextField
                    label={`${intl.formatMessage({ id: 'postEditor.tweetBlock', defaultMessage: 'URL del tweet' })} ${idx + 1}`}
                    fullWidth
                    value={block.content}
                    onChange={e => handleBlockChange(section.id, idx, 'content', e.target.value)}
                  />
                )}
              </Box>
            ))}
          </CardContent>
        </Card>
      ))}

      <Box mt={3}>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          <FormattedMessage id="postEditor.publish" defaultMessage="Publicar post" />
        </Button>
      </Box>
    </Box>
  );
};

export default PostSectionEditor;
