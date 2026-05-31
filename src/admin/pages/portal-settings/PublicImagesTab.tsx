import { FaImage } from "react-icons/fa";
import { PortalSettingsAlert } from "./PortalSettingsAlert";
import { PortalImageGrid } from "./PortalImageGrid";

type PublicImagesTabProps = {
  refreshKey: number;
};

export function PublicImagesTab({ refreshKey }: PublicImagesTabProps) {
  return (
    <div className="space-y-4">
      <PortalSettingsAlert title="Public Portal Images" icon={<FaImage />}>
        <p>
          These images will be used as rotating background images to showcase your building/property on the public
          portal/website.
          <br />
          <br />
          It is <strong className="underline">highly</strong> recommended to ensure these images are optimized to the
          lowest file size possible (while maintaining quality) as these have a dramatic impact on loading time for your
          users.
        </p>
      </PortalSettingsAlert>
      <PortalImageGrid
        kind="public"
        title="Building & Property Images"
        emptyTitle="There are no building images."
        emptyHint='Click "Add New" to add a new image. A default image will be used until you add more.'
        refreshKey={refreshKey}
      />
    </div>
  );
}
