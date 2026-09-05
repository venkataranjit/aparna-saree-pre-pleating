import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
} from '@mui/material';
import DryCleaningIcon from '@mui/icons-material/DryCleaning';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import IronIcon from '@mui/icons-material/Iron';
import CelebrationIcon from '@mui/icons-material/Celebration';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../../../auth/context/AuthContext';
import { USER_ROLES } from '../../../firebase/schema';
import './Services.scss';

const servicesList = [
  {
    title: 'Bridal Saree Pre-Pleating',
    description: 'Specialized pre-pleating for heavy bridal Kanjeevaram and Silk sarees with safety pin reinforcement.',
    price: '₹1,200',
    icon: <CelebrationIcon sx={{ color: '#d4af37 !important', fontSize: 36 }} />,
    tag: 'Popular',
  },
  {
    title: 'Standard Saree Pre-Pleating',
    description: 'Precision pleating for casual and festive sarees (Georgette, Chiffon, Cotton, Silk).',
    price: '₹600',
    icon: <DryCleaningIcon sx={{ color: '#d4af37 !important', fontSize: 36 }} />,
    tag: 'Essential',
  },
  {
    title: 'Box Folding & Packing',
    description: 'Sturdy travel-friendly box folding to keep pleats crisp during travel or destination weddings.',
    price: '₹450',
    icon: <Inventory2Icon sx={{ color: '#d4af37 !important', fontSize: 36 }} />,
    tag: 'Add-on',
  },
  {
    title: 'Steam Ironing & Pleat Setting',
    description: 'Delicate fabric steam pressing and heat setting for wrinkle-free drapes.',
    price: '₹350',
    icon: <IronIcon sx={{ color: '#d4af37 !important', fontSize: 36 }} />,
    tag: 'Care',
  },
];

const Services = () => {
  const { role, isSuperAdmin, canEdit } = useAuth();
  const userCanEdit = canEdit ?? (isSuperAdmin || role === USER_ROLES.ADMIN || role === USER_ROLES.SUPERADMIN);

  return (
    <Box className="services-page">
      <Box className="services-page__header">
        <Box>
          <Typography variant="h4" component="h1" className="page-title">
            Pre-Pleating Services Catalog
          </Typography>
          <Typography variant="body2" className="page-subtitle">
            Manage services, pricing packages, and specialized draping options
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon sx={{ color: '#000000 !important' }} />}
          className="add-service-btn"
        >
          Add Service
        </Button>
      </Box>

      <Grid container spacing={3}>
        {servicesList.map((svc) => (
          <Grid item xs={12} sm={6} md={3} key={svc.title}>
            <Card className="services-page__card">
              <CardContent>
                <Box className="icon-container">{svc.icon}</Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" className="service-name">
                    {svc.title}
                  </Typography>
                </Box>
                <Chip
                  label={svc.tag}
                  size="small"
                  className="service-tag"
                  variant="outlined"
                />
                <Typography variant="body2" className="service-desc">
                  {svc.description}
                </Typography>
                <Typography variant="h5" className="service-price">
                  {svc.price}
                </Typography>
              </CardContent>
              {userCanEdit && (
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button size="small" variant="outlined" color="primary" fullWidth className="edit-btn">
                    Edit Service
                  </Button>
                </CardActions>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Services;
