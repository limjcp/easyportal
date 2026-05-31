import { FaImage } from "react-icons/fa";
import { PortalSettingsAlert } from "./PortalSettingsAlert";
import { PortalImageGrid } from "./PortalImageGrid";

type ResidentImagesTabProps = {
  refreshKey: number;
};

export function ResidentImagesTab({ refreshKey }: ResidentImagesTabProps) {
  return (
    <div className="space-y-4">
      <PortalSettingsAlert title="Resident Portal Image" icon={<FaImage />}>
        <p>
          This image will be used as the background image when residents have logged into the portal.
          <br />
          <br />
          It is <strong className="underline">highly</strong> recommended to ensure this image is optimized to the lowest
          file size possible (while maintaining quality) as it will have a dramatic impact on loading time for your users.
        </p>
      </PortalSettingsAlert>
      <PortalImageGrid
        kind="resident"
        title="Resident Portal Background Images"
        emptyTitle="There are no resident portal background images."
        emptyHint='Click "Add New" to add a background image.'
        note="The first image listed will be used as the background image when residents have logged into the portal."
        refreshKey={refreshKey}
      />
    </div>
  );
}
