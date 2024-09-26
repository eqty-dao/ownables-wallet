import React, { useState } from 'react';
import { Stack, TextField as MuiTextField, Chip as MuiChip } from '@mui/material';
import styled from '@emotion/styled';

const Label = styled.label`
  color: #fcfcf7;
  font-size: 14px;
  font-weight: 400;
  display: block;
  margin-bottom: 8px;
`;

const Container = styled.div`
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const StyledTextField = styled(MuiTextField)`
  & .MuiOutlinedInput-root {
    color: white;
    background-color: transparent;
    border: 1px solid #3a3a3c;
    border-radius: 8px;
    padding: 0 16px;
  }
  & .MuiOutlinedInput-input {
    color: white;
  }
`;

const StyledChip = styled(MuiChip)`
  color: white;
  border-color: white;
`;

interface TagInputFieldProps {
    onTagsChange: (tags: string[]) => void;
  }

const TagInputField = ({ onTagsChange }: TagInputFieldProps) => {
  const [inputValue, setInputValue] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setError('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prevTags => prevTags.filter(tag => tag !== tagToRemove));
  };

  const handleAddTag = () => {
    if (!inputValue.trim()) {
      setError('Tag cannot be empty.');
      return;
    }
    if (tags.includes(inputValue)) {
      setError('Tag already exists.');
      return;
    }
    const newTags = [...tags, inputValue];
    setTags(newTags);
    onTagsChange(newTags);
    setInputValue('');
  };

  return (
    <Container>
      <Label>Enter your keywords</Label>
      <StyledTextField
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleAddTag();
          }
        }}
        variant="outlined"
        size="small"
        error={!!error}
        helperText={error}
      />
      <Stack direction="row" spacing={1}>
        {tags.map(tag => (
          <StyledChip
            key={tag}
            label={tag}
            onDelete={() => handleRemoveTag(tag)}
            color="primary"
            variant="outlined"
            size="small"
          />
        ))}
      </Stack>
    </Container>
  );
};

export default TagInputField;