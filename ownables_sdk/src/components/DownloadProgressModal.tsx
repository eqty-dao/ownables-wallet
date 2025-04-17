import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Dialog,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Button,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { styled } from '@mui/system';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { themeColors } from '../theme/themeColors';

// File type icons
import { ReactComponent as GenericFileIcon } from '../assets/file_icons/generic_file.svg';

interface DownloadItem {
  id: string;
  name: string;
  hash: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  size?: number; // in bytes
}

interface DownloadProgressModalProps {
  open: boolean;
  onClose: () => void;
  downloadItems: DownloadItem[];
  onCancelItem?: (id: string) => void;
  onCancelAll?: () => void;
  title?: string;
}

// Styled components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    background: '#1a0033',
    borderRadius: 16,
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
    maxWidth: 480,
    minWidth: 360,
    width: '100%',
    margin: theme.breakpoints.down('sm') ? '0' : '32px',
    height: theme.breakpoints.down('sm') ? '100%' : 'auto',
  },
  '& .MuiBackdrop-root': {
    backdropFilter: 'blur(5px)',
    backgroundColor: 'rgba(26, 0, 51, 0.5)',
  }
}));

const DialogHeader = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.breakpoints.down('sm') ? '12px 16px' : '16px 20px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'linear-gradient(180deg, rgba(81, 0, 148, 0.4) 0%, rgba(81, 0, 148, 0) 100%)',
}));

const FileItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.breakpoints.down('sm') ? '12px 0' : '16px 0',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  '&:last-child': {
    borderBottom: 'none',
  },
}));

const FileIcon = styled(Box)(({ theme }) => ({
  width: theme.breakpoints.down('sm') ? 36 : 48,
  height: theme.breakpoints.down('sm') ? 36 : 48,
  marginRight: theme.breakpoints.down('sm') ? 12 : 16,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  '& svg': {
    width: theme.breakpoints.down('sm') ? 24 : 32,
    height: theme.breakpoints.down('sm') ? 24 : 32,
  }
}));

const FileDetails = styled(Box)({
  flex: 1,
});

const FileName = styled(Typography)<{ theme?: any }>(({ theme }) => ({
  color: themeColors.titleText,
  fontWeight: 600,
  fontSize: theme?.breakpoints.down('sm') ? '14px' : '16px',
  marginBottom: '4px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const FileHash = styled(Typography)<{ theme?: any }>(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: theme?.breakpoints.down('sm') ? '10px' : '12px',
  fontFamily: 'monospace',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: '100%',
}));

const StyledLinearProgress = styled(LinearProgress)<{ theme?: any }>(({ theme }) => ({
  marginTop: 8,
  height: theme?.breakpoints.down('sm') ? 6 : 8,
  borderRadius: 4,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
  },
}));

const StatusIndicator = styled(Box)<{ 
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  theme?: any;
}>(({ status, theme }) => ({
  width: theme?.breakpoints.down('sm') ? 20 : 24,
  height: theme?.breakpoints.down('sm') ? 20 : 24,
  borderRadius: '50%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginLeft: theme?.breakpoints.down('sm') ? 12 : 16,
  ...getStatusStyles(status),
}));

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'completed':
      return {
        backgroundColor: '#4caf50',
        '&::after': {
          content: '"✓"',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 'bold',
        }
      };
    case 'failed':
      return {
        backgroundColor: '#f44336',
        '&::after': {
          content: '"✕"',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 'bold',
        }
      };
    case 'downloading':
      return {
        backgroundColor: '#510094',
        '&::after': {
          content: '""',
          width: '8px',
          height: '8px',
          backgroundColor: '#fff',
          borderRadius: '50%',
          animation: 'pulse 1.5s infinite',
        }
      };
    default:
      return {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
      };
  }
};

const CancelButton = styled(Button)({
  color: '#ffffff',
  background: 'rgba(244, 67, 54, 0.1)',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '14px',
  textTransform: 'none',
  '&:hover': {
    background: 'rgba(244, 67, 54, 0.2)',
  },
});

const MinimizeButton = styled(Button)<{ theme?: any }>(({ theme }) => ({
  color: '#ffffff',
  background: 'rgba(81, 0, 148, 0.2)',
  borderRadius: '8px',
  padding: theme?.breakpoints.down('sm') ? '6px 12px' : '8px 16px',
  fontSize: theme?.breakpoints.down('sm') ? '12px' : '14px',
  marginRight: '8px',
  textTransform: 'none',
  '&:hover': {
    background: 'rgba(81, 0, 148, 0.3)',
  },
}));

const DownloadProgressModal: React.FC<DownloadProgressModalProps> = ({
  open,
  onClose,
  downloadItems,
  onCancelItem,
  onCancelAll,
  title = "Ownable Import"
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isMinimized, setIsMinimized] = useState(false);

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleRestore = () => {
    setIsMinimized(false);
  };

  const getTotalProgress = () => {
    if (downloadItems.length === 0) return 0;
    const totalProgress = downloadItems.reduce((sum, item) => sum + item.progress, 0);
    return totalProgress / downloadItems.length;
  };

  // Add pulsing animation
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.3; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (!open) return null;

  if (isMinimized) {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 9999,
          background: 'rgba(26, 0, 51, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 16,
          padding: '16px',
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)',
          }
        }}
        onClick={handleRestore}
      >
        <Box sx={{ width: 36, height: 36, mr: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GenericFileIcon />
        </Box>
        <Box sx={{ mr: 2 }}>
          <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
            Importing Ownables
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {Math.round(getTotalProgress())}% Complete
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={getTotalProgress()} 
          sx={{ 
            width: 60, 
            height: 4, 
            borderRadius: 2,
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#510094',
            }
          }} 
        />
      </Box>
    );
  }

  return (
    <StyledDialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogHeader>
        <Typography sx={{ 
          fontSize: isMobile ? '18px' : '20px', 
          fontWeight: 600, 
          color: themeColors.titleText 
        }}>
          {title}
        </Typography>
        <IconButton 
          onClick={onClose} 
          sx={{ 
            color: themeColors.error,
            padding: isMobile ? '8px' : '12px',
          }}
        >
          <CloseIcon sx={{ fontSize: isMobile ? '20px' : '24px' }} />
        </IconButton>
      </DialogHeader>
      
      <DialogContent sx={{ 
        padding: 0,
        height: isMobile ? 'calc(100% - 120px)' : 'auto',
      }}>
        <Box sx={{ 
          padding: isMobile ? '12px 16px' : '16px 20px',
          maxHeight: isMobile ? '100%' : '400px',
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255, 255, 255, 0.05)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#510094',
            borderRadius: '4px',
          },
        }}>
          {downloadItems.map((item) => (
            <FileItem key={item.id}>
              <FileIcon>
                <InsertDriveFileIcon />
              </FileIcon>
              <FileDetails>
                <FileName>{item.name || item.hash.substring(0, 15) + '...'}</FileName>
                <FileHash>{item.hash}</FileHash>
                <StyledLinearProgress 
                  variant="determinate" 
                  value={item.progress} 
                  color={
                    item.status === 'completed' ? 'success' : 
                    item.status === 'failed' ? 'error' : 'primary'
                  }
                />
              </FileDetails>
              <StatusIndicator status={item.status} />
            </FileItem>
          ))}
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: isMobile ? '12px 16px' : '16px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(81, 0, 148, 0.1)',
          position: isMobile ? 'fixed' : 'relative',
          bottom: isMobile ? 0 : 'auto',
          left: 0,
          right: 0,
        }}>
          <Box>
            <Typography variant="body2" sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: isMobile ? '12px' : '14px',
            }}>
              Overall Progress: {Math.round(getTotalProgress())}%
            </Typography>
          </Box>
          <Box>
            <MinimizeButton 
              onClick={handleMinimize}
              size={isMobile ? "small" : "medium"}
              sx={{
                padding: isMobile ? '6px 12px' : '8px 16px',
                fontSize: isMobile ? '12px' : '14px',
              }}
            >
              Minimize
            </MinimizeButton>
          </Box>
        </Box>
      </DialogContent>
    </StyledDialog>
  );
};

export default DownloadProgressModal; 