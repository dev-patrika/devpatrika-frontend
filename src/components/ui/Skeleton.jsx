import React from 'react';
import { twMerge } from 'tailwind-merge';

const Skeleton = ({
  className,
  ...props
}) => {
  return (
    <div
      className={twMerge('animate-pulse rounded-md bg-zinc-800/60', className)}
      {...props}
    />
  );
};

export default Skeleton;
