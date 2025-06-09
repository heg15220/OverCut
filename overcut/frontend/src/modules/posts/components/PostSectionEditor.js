import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import * as actions from '../actions';
import * as selectors from '../selectors';
import {
  Box, Button, Card, CardContent, TextField, MenuItem, Typography, IconButton
} from '@mui/material';
import { Add, Delete, ArrowUpward, ArrowDownward } from '@mui/icons-material';

const PostSectionEditor = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const categories = useSelector(selectors.findAllCategories);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [categoryId, setCategoryId] = useState(1);
  const [mainImage, setMainImage] = useState(null);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    dispatch(actions.getAllCategories(() => {}));
  }, [dispatch]);

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
      section.id === sectionId ? {
        ...section,
        blocks: [...section.blocks, { type, content: '', image: null }]
      } : section
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
    dispatch(actions.createPost({ title, subtitle, article: '', categoryId, image: mainImage },
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
      <Typography variant="h4" gutterBottom>Nuevo Post</Typography>
      <TextField fullWidth label="Título" margin="normal" value={title} onChange={e => setTitle(e.target.value)} />
      <TextField fullWidth label="Subtítulo" margin="normal" value={subtitle} onChange={e => setSubtitle(e.target.value)} />
      <TextField
        select
        fullWidth
        label="Categoría"
        margin="normal"
        value={categoryId}
        onChange={e => setCategoryId(e.target.value)}
      >
        {categories.map(cat => (
          <MenuItem key={cat.categoryId} value={cat.categoryId}>{cat.name}</MenuItem>
        ))}
      </TextField>

      <Typography variant="subtitle1">Imagen principal del post</Typography>
      <input type="file" accept="image/*" onChange={handleMainImageChange} />

      <Box my={2}>
        <Button onClick={handleAddSection} startIcon={<Add />}>Añadir subsección</Button>
      </Box>

      {sections.map((section, index) => (
        <Card key={section.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Sección {index + 1}</Typography>
              <Box>
                <IconButton onClick={() => handleMove(index, -1)}><ArrowUpward /></IconButton>
                <IconButton onClick={() => handleMove(index, 1)}><ArrowDownward /></IconButton>
                <IconButton onClick={() => handleRemoveSection(section.id)}><Delete /></IconButton>
              </Box>
            </Box>
            <TextField
              label="Título de sección"
              fullWidth
              margin="normal"
              value={section.title}
              onChange={e => handleSectionChange(section.id, 'title', e.target.value)}
            />
            <Box my={1}>
              <Button onClick={() => handleAddBlock(section.id, 'text')}>+ Texto</Button>
              <Button onClick={() => handleAddBlock(section.id, 'image')}>+ Imagen</Button>
              <Button onClick={() => handleAddBlock(section.id, 'tweet')}>+ Tweet</Button>
            </Box>
            {section.blocks.map((block, idx) => (
              <Box key={idx} my={1}>
                {block.type === 'text' && (
                  <TextField
                    label={`Texto ${idx + 1}`}
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
                    label={`URL del tweet ${idx + 1}`}
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
          Publicar post
        </Button>
      </Box>
    </Box>
  );
};

export default PostSectionEditor;
