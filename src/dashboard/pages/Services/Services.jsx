import React from 'react';
import DryCleaningIcon from '@mui/icons-material/DryCleaning';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import IronIcon from '@mui/icons-material/Iron';
import CelebrationIcon from '@mui/icons-material/Celebration';
import AddIcon from '@mui/icons-material/Add';
import { AppButton, AppCard } from '../../../components/common';
import { useAuth } from '../../../auth/context/AuthContext';
import { USER_ROLES } from '../../../firebase/schema';
import './Services.scss';

const servicesList = [
  {
    title: 'Bridal Saree Pre-Pleating',
    description: 'Specialized pre-pleating for heavy bridal Kanjeevaram and Silk sarees with safety pin reinforcement.',
    price: '₹1,200',
    icon: <CelebrationIcon />,
    tag: 'Popular',
  },
  {
    title: 'Standard Saree Pre-Pleating',
    description: 'Precision pleating for casual and festive sarees (Georgette, Chiffon, Cotton, Silk).',
    price: '₹600',
    icon: <DryCleaningIcon />,
    tag: 'Essential',
  },
  {
    title: 'Box Folding & Packing',
    description: 'Sturdy travel-friendly box folding to keep pleats crisp during travel or destination weddings.',
    price: '₹450',
    icon: <Inventory2Icon />,
    tag: 'Add-on',
  },
  {
    title: 'Steam Ironing & Pleat Setting',
    description: 'Delicate fabric steam pressing and heat setting for wrinkle-free drapes.',
    price: '₹350',
    icon: <IronIcon />,
    tag: 'Care',
  },
];

const Services = () => {
  const { role, isSuperAdmin, canEdit } = useAuth();
  const userCanEdit = canEdit ?? (isSuperAdmin || role === USER_ROLES.ADMIN || role === USER_ROLES.SUPERADMIN);

  return (
    <div className="services-page">
      <div className="services-page__header">
        <div>
          <h1 className="page-title">
            Pre-Pleating Services Catalog
          </h1>
          <p className="page-subtitle">
            Manage services, pricing packages, and specialized draping options
          </p>
        </div>
        <AppButton
          variant="primary"
          icon={<AddIcon />}
          className="add-service-btn"
        >
          Add Service
        </AppButton>
      </div>

      <div className="services-grid">
        {servicesList.map((svc) => (
          <AppCard key={svc.title} className="services-page__card">
            <div className="services-card-content">
              <div className="icon-container">{svc.icon}</div>
              <div className="service-title-row">
                <h3 className="service-name">
                  {svc.title}
                </h3>
              </div>
              <span className="service-tag">
                {svc.tag}
              </span>
              <p className="service-desc">
                {svc.description}
              </p>
              <div className="service-price">
                {svc.price}
              </div>
            </div>
            {userCanEdit && (
              <div className="services-card-actions">
                <AppButton size="sm" variant="secondary" fullWidth className="edit-btn">
                  Edit Service
                </AppButton>
              </div>
            )}
          </AppCard>
        ))}
      </div>
    </div>
  );
};

export default Services;
