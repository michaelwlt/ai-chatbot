import type { Attachment } from 'ai';
import Image from 'next/image';

import { LoaderIcon } from './icons';

type ExtendedAttachment = Attachment & {
  originalName?: string;
};

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
}: {
  attachment: ExtendedAttachment;
  isUploading?: boolean;
}) => {
  const { name, originalName, url, contentType } = attachment;
  return (
    <div className="flex flex-col gap-2">
      <div className="w-20 h-16 aspect-video bg-muted rounded-md relative flex flex-col items-center justify-center">
        {contentType ? (
          contentType.startsWith('image') ? (
            <Image
              key={url}
              src={url}
              alt={originalName ?? name ?? 'An image attachment'}
              className="rounded-md size-full object-cover"
              fill
              sizes="(max-width: 80px) 100vw, 80px"
            />
          ) : (
            <div className="" />
          )
        ) : (
          <div className="" />
        )}

        {isUploading && (
          <div className="animate-spin absolute text-zinc-500">
            <LoaderIcon />
          </div>
        )}
      </div>
      <div className="text-xs text-zinc-500 max-w-16 truncate">{originalName ?? name}</div>
    </div>
  );
};
