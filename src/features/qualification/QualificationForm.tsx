'use client';

import {
  CheckCircleOutlined,
  EuroOutlined,
  PhoneOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import {
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import {
  CanalRelance,
  MotifNonProductif,
  QualificationOpportunite,
  QualificationProductif,
  QualificationTransformation,
} from '@/types';
import type { QualificationRDV } from '@/types';

const { Text } = Typography;

interface FormValues {
  productif: QualificationProductif;
  motifNonProductif?: MotifNonProductif;
  motifNonProductifAutre?: string;
  opportunite: QualificationOpportunite;
  montantEstimeDevis?: number;
  descriptionDevis?: string;
  transformation: QualificationTransformation;
  dateRelance?: dayjs.Dayjs;
  canalRelance?: CanalRelance;
}

interface WatchedValues {
  productif: QualificationProductif | null;
  motifNonProductif: MotifNonProductif | null;
  opportunite: QualificationOpportunite | null;
  transformation: QualificationTransformation | null;
}

interface Props {
  initialValues?: Partial<QualificationRDV>;
  watched: WatchedValues;
  onValuesChange: (changed: Partial<FormValues>) => void;
}

export function QualificationFormFields({ initialValues, watched, onValuesChange }: Props) {
  const isNonProductif = watched.productif === QualificationProductif.NON_PRODUCTIF;
  const isAutreMotif = watched.motifNonProductif === MotifNonProductif.AUTRE;
  const isDevisDemande = watched.opportunite === QualificationOpportunite.DEVIS_DEMANDE;
  const isRelanceNecessaire =
    watched.transformation === QualificationTransformation.RELANCE_NECESSAIRE;

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      {/* ── Axe 1 ── */}
      <ProCard
        title={
          <Space>
            <span style={stepBadge}>1</span>
            <Text strong>Productivité du rendez-vous</Text>
          </Space>
        }
        bordered
      >
        <Form.Item
          name="productif"
          rules={[{ required: true, message: 'Veuillez sélectionner une option.' }]}
        >
          <Radio.Group onChange={(e) => onValuesChange({ productif: e.target.value })}>
            <Space direction="vertical">
              <Radio value={QualificationProductif.PRODUCTIF}>
                <Text strong>Productif</Text>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  — Le rendez-vous s&apos;est bien déroulé
                </Text>
              </Radio>
              <Radio value={QualificationProductif.NON_PRODUCTIF}>
                <Text strong>Non productif</Text>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  — Le rendez-vous n&apos;a pas abouti
                </Text>
              </Radio>
            </Space>
          </Radio.Group>
        </Form.Item>

        {isNonProductif && (
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="motifNonProductif"
                label="Motif"
                rules={[{ required: true, message: 'Veuillez indiquer un motif.' }]}
              >
                <Select
                  placeholder="Sélectionner un motif"
                  onChange={(v) => onValuesChange({ motifNonProductif: v })}
                  options={[
                    { value: MotifNonProductif.CLIENT_ABSENT, label: 'Client absent' },
                    { value: MotifNonProductif.REPORTE, label: 'Reporté' },
                    { value: MotifNonProductif.PAS_INTERESSE, label: 'Pas intéressé' },
                    { value: MotifNonProductif.AUTRE, label: 'Autre (préciser)' },
                  ]}
                />
              </Form.Item>
            </Col>
            {isAutreMotif && (
              <Col xs={24} sm={12}>
                <Form.Item
                  name="motifNonProductifAutre"
                  label="Précision"
                  rules={[{ required: true, message: 'Veuillez préciser.' }]}
                >
                  <Input placeholder="Décrivez le motif…" />
                </Form.Item>
              </Col>
            )}
          </Row>
        )}
      </ProCard>

      {/* ── Axe 2 ── */}
      <ProCard
        title={
          <Space>
            <span style={stepBadge}>2</span>
            <Text strong>Opportunité commerciale</Text>
          </Space>
        }
        bordered
      >
        <Form.Item
          name="opportunite"
          rules={[{ required: true, message: 'Veuillez sélectionner une option.' }]}
        >
          <Radio.Group onChange={(e) => onValuesChange({ opportunite: e.target.value })}>
            <Space direction="vertical">
              <Radio value={QualificationOpportunite.AUCUNE}>
                <Text strong>Aucune opportunité</Text>
              </Radio>
              <Radio value={QualificationOpportunite.OPPORTUNITE_IDENTIFIEE}>
                <Space>
                  <TeamOutlined />
                  <Text strong>Opportunité identifiée</Text>
                  <Text type="secondary">— Intérêt confirmé, suivi à planifier</Text>
                </Space>
              </Radio>
              <Radio value={QualificationOpportunite.DEVIS_DEMANDE}>
                <Space>
                  <EuroOutlined />
                  <Text strong>Devis demandé</Text>
                  <Text type="secondary">— Le prospect souhaite recevoir un devis</Text>
                </Space>
              </Radio>
            </Space>
          </Radio.Group>
        </Form.Item>

        {isDevisDemande && (
          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col xs={24} sm={10}>
              <Form.Item
                name="montantEstimeDevis"
                label="Montant estimé (€)"
                rules={[{ required: true, message: 'Veuillez indiquer un montant.' }]}
              >
                <InputNumber
                  min={0}
                  step={500}
                  style={{ width: '100%' }}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                  placeholder="Ex : 12 000"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={14}>
              <Form.Item
                name="descriptionDevis"
                label="Description de l'offre"
                rules={[{ required: true, message: 'Veuillez décrire l\'offre.' }]}
              >
                <Input.TextArea rows={2} placeholder="Type de prestation, périmètre…" />
              </Form.Item>
            </Col>
          </Row>
        )}
      </ProCard>

      {/* ── Axe 3 ── */}
      <ProCard
        title={
          <Space>
            <span style={stepBadge}>3</span>
            <Text strong>Suite de la relation client</Text>
          </Space>
        }
        bordered
      >
        <Form.Item
          name="transformation"
          rules={[{ required: true, message: 'Veuillez sélectionner une option.' }]}
        >
          <Radio.Group onChange={(e) => onValuesChange({ transformation: e.target.value })}>
            <Space direction="vertical">
              <Radio value={QualificationTransformation.TRANSFORME_CLIENT}>
                <Space>
                  <CheckCircleOutlined style={{ color: '#5B8C5A' }} />
                  <Text strong>Transformé en client</Text>
                  <Text type="secondary">— Le prospect devient client</Text>
                </Space>
              </Radio>
              <Radio value={QualificationTransformation.RELANCE_NECESSAIRE}>
                <Space>
                  <PhoneOutlined />
                  <Text strong>Relance nécessaire</Text>
                  <Text type="secondary">— Un suivi est à planifier</Text>
                </Space>
              </Radio>
            </Space>
          </Radio.Group>
        </Form.Item>

        {isRelanceNecessaire && (
          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col xs={24} sm={10}>
              <Form.Item
                name="dateRelance"
                label="Date de relance"
                rules={[{ required: true, message: 'Veuillez choisir une date.' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  disabledDate={(d) => d.isBefore(dayjs(), 'day')}
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={14}>
              <Form.Item
                name="canalRelance"
                label="Canal de relance"
                rules={[{ required: true, message: 'Veuillez choisir un canal.' }]}
              >
                <Select
                  placeholder="Sélectionner un canal"
                  options={[
                    { value: CanalRelance.TELEPHONE, label: 'Téléphone' },
                    { value: CanalRelance.EMAIL, label: 'Email' },
                    { value: CanalRelance.VISITE, label: 'Visite sur site' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        )}
      </ProCard>
    </Space>
  );
}

const stepBadge: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  borderRadius: '50%',
  background: '#5B8C5A',
  color: '#fff',
  fontSize: 13,
  fontWeight: 'bold',
  flexShrink: 0,
};
