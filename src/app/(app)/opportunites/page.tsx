import { ModuleDesactive } from '@/components/ModuleDesactive';
import { estActive } from '@/config/fonctionnalites';
import { OpportunitesPage } from '@/features/opportunites/OpportunitesPage';

export default function Page() {
  if (!estActive('opportunites')) return <ModuleDesactive nom="Opportunités" />;
  return <OpportunitesPage />;
}
