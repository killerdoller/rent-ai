import { EditProperty } from '../../../../src/flow/components/owner/EditProperty';

export default async function Page({ params }) {
  const { id } = await params;
  return <EditProperty propertyId={id} />;
}
