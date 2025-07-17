import { forwardRef } from 'react';

// Custom Image component that avoids fetchPriority warnings by using regular img tag
interface SafeImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  priority?: boolean;
  className?: string;
}

const SafeImage = forwardRef<HTMLImageElement, SafeImageProps>((props, ref) => {
  const { src, alt, width, height, style, priority, className, ...otherProps } = props;
  
  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      width={width}
      height={height}
      style={style}
      className={className}
      {...otherProps}
    />
  );
});

SafeImage.displayName = 'SafeImage';

export default SafeImage;