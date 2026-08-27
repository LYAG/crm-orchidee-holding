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
    let created: SupportCommercial | null = null;
    try {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        message.error('Seul le format PDF est pris en charge pour l’instant.');
        return false;
      }

      const titre = file.name.replace(/\.[^.]+$/, '');
      // Métadonnées d'abord (nombreSlides=0, provisoire) — le fichier réel est ensuite
      // uploadé séparément (POST /supports/{id}/fichier), le backend y recalcule le
      // nombre de pages réel du PDF et incrémente la version.
      created = await supportService.create({
        titre,
        type: SupportType.PDF,
        nombreSlides: 0,
        dateVersion: new Date().toISOString().slice(0, 10),
        actif: true,
        version: 0,
      });
      const support = await supportService.uploaderFichier(created.id, file);

      setCreatedSupport(support);
      onSuccess(support);
      message.success('Support importé avec succès.');
    } catch (err) {
      // Si l'upload du fichier échoue après la création des métadonnées, on supprime
      // la fiche orpheline plutôt que de laisser un support sans contenu dans la bibliothèque.
      if (created) await supportService.delete(created.id).catch(() => {});
      message.error(err instanceof Error ? err.message : 'Erreur lors de l’import du support.');
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
            message="Déposez un fichier PDF. C'est ce document qui sera utilisé pour la présentation (web et mobile)."
          />
          <Dragger
            accept=".pdf"
            beforeUpload={handleUpload}
            showUploadList={false}
            disabled={loading}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">{loading ? 'Import en cours…' : 'Cliquez ou déposez un fichier ici'}</p>
            <p className="ant-upload-hint">PDF uniquement</p>
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
          <Text>Nombre de slides (pages du PDF) : {createdSupport.nombreSlides}</Text>
          <Text>Date de version : {createdSupport.dateVersion}</Text>
        </Space>
      )}
    </Modal>
  );
}
