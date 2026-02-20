import { Switch as ChakraSwitch } from "@chakra-ui/react";
import * as React from "react";

export interface SwitchProps extends ChakraSwitch.RootProps {
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  rootRef?: React.Ref<HTMLLabelElement>;
  trackLabel?: { on: React.ReactNode; off: React.ReactNode };
  thumbLabel?: { on: React.ReactNode; off: React.ReactNode };
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (props, ref) => {
    const { inputProps, children, rootRef, trackLabel, thumbLabel, ...rest } =
      props;

    return (
      <ChakraSwitch.Root ref={rootRef} {...rest}>
        <ChakraSwitch.HiddenInput ref={ref} {...inputProps} />
        <ChakraSwitch.Control
          width="52px"
          height="28px"
          borderRadius="24px"
          bg="transparent"
          boxShadow="1px 1px 3px 0px rgba(0, 0, 0, 0.25), 1px 1px 2px 0px rgba(0, 0, 0, 0.25) inset, 0.5px 0.5px 0.5px 0px rgba(255, 255, 255, 1) inset"
          _checked={{
            bg: "transparent",
          }}
        >
          <ChakraSwitch.Thumb
            width="26px"
            height="26px"
            bg="rgba(255, 255, 255, 0.6)"
            _checked={{
              bg: "rgba(33, 255, 240, 1)",
              transform: "translateX(8px)",
            }}
          >
            {thumbLabel && (
              <ChakraSwitch.ThumbIndicator fallback={thumbLabel?.off}>
                {thumbLabel?.on}
              </ChakraSwitch.ThumbIndicator>
            )}
          </ChakraSwitch.Thumb>
          {trackLabel && (
            <ChakraSwitch.Indicator fallback={trackLabel.off}>
              {trackLabel.on}
            </ChakraSwitch.Indicator>
          )}
        </ChakraSwitch.Control>
        {children != null && (
          <ChakraSwitch.Label>{children}</ChakraSwitch.Label>
        )}
      </ChakraSwitch.Root>
    );
  }
);
