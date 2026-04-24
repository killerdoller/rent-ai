import { EditProperty } from '../../../../src/flow/components/owner/EditProperty';

export default function Page({ params }) {
  return <EditProperty propertyId={params.id} />;
}
