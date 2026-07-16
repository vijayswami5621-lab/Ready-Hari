import React from 'react';
import { SecureImage } from '../common/SecureImage';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | any;
  alt?: string;
  fallbackSrc?: string;
  containerClassName?: string;
  cacheBuster?: string | number;
}

export const LazyImage: React.FC<LazyImageProps> = (props) => {
  return <SecureImage {...props} />;
};
