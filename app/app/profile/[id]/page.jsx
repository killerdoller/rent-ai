import { ProfileView } from "../../../../src/flow/components/ProfileView";

export default function ProfilePage({ params }) {
  return <ProfileView userId={params.id} />;
}
