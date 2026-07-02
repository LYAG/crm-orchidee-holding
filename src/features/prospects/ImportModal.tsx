'use client';

import { InboxOutlined } from '@ant-design/icons';
import { ProDescriptions } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Col,
  Divider,
  Modal,
  Row,
  Space,
  Tag,
  Typography,
  Upload,
} from 'antd';
import { useState } from 'react';
import { prospectService } from '@/services';
import type { ImportResult } from '@/types';

const { Dragger } = Upload;
const { Text, Title } = Typography;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ImportModal({ open, onOpenChange, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleUpload(file: File) {
    setLoading(true);
    try {
      const res = await prospectService.simulerImportExcel(file.name);
      setResult(res);
      onSuccess();
    } catch {
      // handled by result state
    } finally {
      setLoading(false);
    }
    return false; // prevent default upload
  }

  function handleClose() {
    setResult(null);
    onOpenChange(false);
  }

  return (
    <Modal
      title="Importer des prospects (Excel)"
      open={open}
      onCancel={handleClose}
      footer={
        result ? (
          <Button type="primary" onClick={handleClose}>
            Fermer
          </Button>
        ) : null
      }
      width={640}
    >
      {!result ? (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="Format attendu : colonnes Nom, Prénom, Entreprise, Email, Téléphone, Zone."
          />
          <Dragger
            accept=".xlsx,.xls,.csv"
            beforeUpload={handleUpload}
            showUploadList={false}
            disabled={loading}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Cliquez ou déposez un fichier Excel ici
            </p>
            <p className="ant-upload-hint">.xlsx, .xls ou .csv — max 5 Mo</p>
          </Dragger>
        </Space>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Row gutter={16}>
            <Col span={8}>
              <ProDescriptions.Item label="Total de lignes">
                {result.totalLignes}
              </ProDescriptions.Item>
            </Col>
            <Col span={8}>
              <Text>
                <Tag color="green">{result.lignesValides} valides</Tag>
              </Text>
            </Col>
            <Col span={8}>
              <Text>
                <Tag color="orange">{result.doublons.length} doublons</Tag>
                <Tag color="red">{result.erreurs.length} erreurs</Tag>
              </Text>
            </Col>
          </Row>

          {result.erreurs.length > 0 && (
            <>
              <Divider plain>
                Erreurs de format
              </Divider>
              {result.erreurs.map((e) => (
                <Alert
                  key={e.ligne}
                  type="error"
                  message={`Ligne ${e.ligne} : ${e.message}`}
                  banner
                />
              ))}
            </>
          )}

          {result.doublons.length > 0 && (
            <>
              <Divider plain>
                Doublons détectés
              </Divider>
              <Alert
                type="warning"
                showIcon
                message={`${result.doublons.length} doublon(s) détecté(s). Un administrateur doit les valider dans la section "Gestion des doublons".`}
              />
            </>
          )}
        </Space>
      )}
    </Modal>
  );
}
