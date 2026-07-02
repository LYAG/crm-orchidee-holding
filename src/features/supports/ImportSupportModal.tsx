'use client';

import { InboxOutlined } from '@ant-design/icons';
import { Alert, Button, message, Modal, Space, Typography, Upload } from 'antd';
import { useState } from 'react';
import { supportService } from '@/services';
import { SupportType } from '@/types';
import type { SupportCommercial } from '@/types';

const { Dragger } = Upload;
const { Text } = Typography;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (support: SupportCommercial) => void;
}

export function ImportSupportModal({ open, onOpenChange, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [createdSupport, setCreatedSupport] = useState<SupportCommercial | null>(null);

  async function handleUpload(file: File) {
    setLoading(true);
    try {
      const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!['pdf', 'ppt', 'pptx'].includes(extension)) {
        message.error('Format non pris en charge. Utilisez un fichier PDF ou PPT.');
        return false;
      }

      const type = extension === 'pdf' ? SupportType.PDF : SupportType.PPT;
      const titre = file.name.replace(/\.[^.]+$/, '');
      const nombreSlides = Math.min(20, Math.max(4, Math.round(file.size / 100000)));
      const support = await supportService.create({
        titre,
        type,
        nombreSlides,
        dateVersion: new Date().toISOString().slice(0, 10),
        actif: true,
      });

      setCreatedSupport(support);
      onSuccess(support);
      message.success('Support importé avec succès.');
    } catch {
      message.error('Erreur lors de l’import du support.');
    } finally {
      setLoading(false);
    }

    return false;
  }

  function handleClose() {
    setCreatedSupport(null);
    onOpenChange(false);
  }

  return (
    <Modal
      title="Importer un support commercial"
      open={open}
      onCancel={handleClose}
      footer={
        createdSupport ? (
          <Button type="primary" onClick={handleClose}>
            Fermer
          </Button>
        ) : null
      }
      width={640}
    >
      {!createdSupport ? (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="Déposez un fichier PDF ou PPT/PPTX. Le contenu du document est simulé pour cette maquette."
          />
          <Dragger
            accept=".pdf,.ppt,.pptx"
            beforeUpload={handleUpload}
            showUploadList={false}
            disabled={loading}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Cliquez ou déposez un fichier ici</p>
            <p className="ant-upload-hint">PDF, PPT ou PPTX — fichier simulé pour l’import</p>
          </Dragger>
        </Space>
      ) : (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert
            type="success"
            showIcon
            message={`Support "${createdSupport.titre}" importé avec succès.`}
          />
          <Text>Type : {createdSupport.type}</Text>
          <Text>Nombre de slides estimé : {createdSupport.nombreSlides}</Text>
          <Text>Date de version : {createdSupport.dateVersion}</Text>
        </Space>
      )}
    </Modal>
  );
}
