import TutorDetailClient from "@/components/tutors/TutorDetailClient";
export default async function TutorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TutorDetailClient profileId={id} />;
}
