/* eslint-disable react/require-default-props */
import { useState, useEffect } from 'react';
import {
  Text, Input, NumberInput, createListCollection, Flex, Box,
} from '@chakra-ui/react';
import { HiQuestionMarkCircle } from 'react-icons/hi';
import { Field } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { Tooltip } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from '@/components/ui/select';
import { settingStyles } from './setting-styles';

// Help Icon Component
interface HelpIconProps {
  content: string;
}

function HelpIcon({ content }: HelpIconProps): JSX.Element {
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  return (
    <Tooltip
      showArrow
      content={
        <Text fontSize="sm" maxW="300px" lineHeight="1.4" color="white" fontFamily="FZLanTingHeiS-R-GB">
          {content}
        </Text>
      }
      open={isHovering}
    >
      <Box
        as={HiQuestionMarkCircle}
        color="gray.300"
        _hover={{ color: 'gray.100' }}
        cursor="help"
        w="16px"
        h="16px"
        ml="2"
        transition="color 0.2s"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
    </Tooltip>
  );
}

// Common Props Types
interface SelectFieldProps {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  collection: ReturnType<typeof createListCollection<{ label: string; value: string }>>
  placeholder: string
}

interface NumberFieldProps {
  label: string
  value: number | string
  onChange: (value: string) => void
  min?: number
  max?: number
  step?: number
  allowMouseWheel?: boolean
  help?: string
}

interface SwitchFieldProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  help?: string
}

interface InputFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

interface SliderFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  help?: string
}

// Global CSS injection to set font family for settings popup
const injectSettingsFontCSS = () => {
  const styleId = 'settings-font';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    /* Set font family for all text in settings popup */
    * {
      font-family: "FZLanTingHeiS-R-GB" !important;
    }
  `;
  document.head.appendChild(style);
};

// Global CSS injection to override Chakra UI Select border
const injectSelectBorderRemovalCSS = () => {
  const styleId = 'select-border-removal';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    /* Target the specific class with maximum specificity */
    html body .css-1hl2915,
    html body .css-1hl2915:hover,
    html body .css-1hl2915:focus,
    html body .css-1hl2915[data-focus],
    html body .css-1hl2915[aria-expanded="true"],
    html body button.css-1hl2915,
    html body button[role="combobox"].css-1hl2915,
    html body [data-part="trigger"].css-1hl2915 {
      border-width: 0 !important;
      border-style: none !important;
      border-color: transparent !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
    }
    
    /* Additional fallback for any select trigger elements */
    html body [data-part="trigger"] {
      border-width: 0 !important;
      border: none !important;
    }
  `;
  document.head.appendChild(style);
};

// Global CSS injection to fix general scroll issues
const injectScrollOverrideCSS = () => {
  const styleId = 'scroll-override';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    /* Ensure Stack components don't constrain height - only in settings context */
    [data-part="content"] .chakra-stack,
    .settings-panel .chakra-stack {
      min-height: auto !important;
      height: auto !important;
    }
    
    /* Smooth scrolling for settings scroll containers only */
    [data-part="content"] * {
      scroll-behavior: smooth !important;
    }
    
    /* Preserve chat history scrolling */
    .cs-message-list {
      overflow-y: auto !important;
      scroll-behavior: smooth !important;
    }
    
    .cs-virtual-list {
      overflow: visible !important;
      height: auto !important;
    }
  `;
  document.head.appendChild(style);
};

// Reusable Components
export function SelectField({
  label,
  value,
  onChange,
  collection,
  placeholder,
}: SelectFieldProps): JSX.Element {
  useEffect(() => {
    injectSelectBorderRemovalCSS();
    injectSettingsFontCSS();
    injectScrollOverrideCSS();
  }, []);

  return (
    <Box
      bg="transparent"
      borderRadius="8px"
      p="3"
      boxShadow="2px 4px 3px 0px rgba(0, 0, 0, 0.25)"
      border="1px solid rgba(255, 255, 255, 0.25)"
      _active={{
        boxShadow: "2px 4px 3px 0px rgba(0, 0, 0, 0.25) inset"
      }}
    >
      <Field
        {...settingStyles.common.field}
        label={<Text fontSize="sm" fontWeight="medium" color="gray.200" fontFamily="FZLanTingHeiS-R-GB">{label}</Text>}
      >
        <SelectRoot
          {...settingStyles.general.select.root}
          collection={collection}
          value={value}
          onValueChange={(e) => onChange(e.value)}
        >
          <SelectTrigger 
            bg="transparent" 
            color="white" 
            _placeholder={{ color: 'gray.400' }}
            _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
            style={{
              borderWidth: '0',
              borderStyle: 'none',
              borderColor: 'transparent',
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
            }}
            className="no-border"
          >
            <SelectValueText placeholder={placeholder} color="white" />
          </SelectTrigger>
          <SelectContent 
            bg="rgba(0, 0, 0, 0.3)" 
            backdropFilter="blur(12px)"
            borderRadius="8px"
            border="1px solid rgba(255, 255, 255, 0.25)"
            boxShadow="0 4px 16px rgba(0, 0, 0, 0.2)"
            zIndex={1300} 
            color="white"
            css={{
              background: 'rgba(0, 0, 0, 0.3) !important',
              backdropFilter: 'blur(12px) !important',
              WebkitBackdropFilter: 'blur(12px) !important',
            }}
          >
            {collection.items.map((item) => (
              <SelectItem 
                key={item.value} 
                item={item} 
                _hover={{ 
                  bg: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                }} 
                _selected={{
                  bg: 'rgba(71, 210, 229, 0.3)',
                  color: 'white',
                }}
                color="white"
                padding="8px 12px"
                borderRadius="4px"
                margin="2px 4px"
              >
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectRoot>
      </Field>
    </Box>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  allowMouseWheel,
  help,
}: NumberFieldProps): JSX.Element {
  return (
    <Box
      bg="transparent"
      borderRadius="8px"
      p="3"
      boxShadow="2px 4px 3px 0px rgba(0, 0, 0, 0.25)"
      border="1px solid rgba(255, 255, 255, 0.25)"
      _active={{
        boxShadow: "2px 4px 3px 0px rgba(0, 0, 0, 0.25) inset"
      }}
    >
      <Field
        {...settingStyles.common.field}
        label={
          <Flex align="center">
            <Text fontSize="sm" fontWeight="medium" color="gray.200" fontFamily="FZLanTingHeiS-R-GB">{label}</Text>
            {help && <HelpIcon content={help} />}
          </Flex>
        }
      >
        <NumberInput.Root
          {...settingStyles.common.numberInput.root}
          value={value.toString()}
          onValueChange={(details) => onChange(details.value)}
          min={min}
          max={max}
          step={step}
          allowMouseWheel={allowMouseWheel}
        >
          <NumberInput.Input {...settingStyles.common.numberInput.input} />
          <NumberInput.Control>
            <NumberInput.IncrementTrigger />
            <NumberInput.DecrementTrigger />
          </NumberInput.Control>
        </NumberInput.Root>
      </Field>
    </Box>
  );
}

export function SwitchField({ label, checked, onChange, help }: SwitchFieldProps): JSX.Element {
  return (
    <Box
      bg="transparent"
      borderRadius="8px"
      p="3"
      boxShadow="2px 4px 3px 0px rgba(0, 0, 0, 0.25)"
      border="1px solid rgba(255, 255, 255, 0.25)"
      _active={{
        boxShadow: "2px 4px 3px 0px rgba(0, 0, 0, 0.25) inset"
      }}
    >
      <Field
        {...settingStyles.common.field}
        label={
          <Flex align="center">
            <Text fontSize="sm" fontWeight="medium" color="gray.200" fontFamily="FZLanTingHeiS-R-GB">{label}</Text>
            {help && <HelpIcon content={help} />}
          </Flex>
        }
      >
        <Switch
          colorPalette="blue"
          size="md"
          checked={checked}
          onCheckedChange={(details) => onChange(details.checked)}
        />
      </Field>
    </Box>
  );
}

export function InputField({
  label,
  value,
  onChange,
  placeholder,
}: InputFieldProps): JSX.Element {
  return (
    <Box
      bg="transparent"
      borderRadius="8px"
      p="3"
      boxShadow="2px 4px 3px 0px rgba(0, 0, 0, 0.25)"
      border="1px solid rgba(255, 255, 255, 0.25)"
      _active={{
        boxShadow: "2px 4px 3px 0px rgba(0, 0, 0, 0.25) inset"
      }}
    >
      <Field
        {...settingStyles.common.field}
        label={<Text fontSize="sm" fontWeight="medium" color="gray.200" fontFamily="FZLanTingHeiS-R-GB">{label}</Text>}
      >
        <Input
          bg="transparent"
          border="none"
          outline="none"
          boxShadow="none"
          color="white"
          _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
          _focus={{ border: 'none', outline: 'none', boxShadow: 'none' }}
          _placeholder={{ color: 'gray.400' }}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </Field>
    </Box>
  );
}

export function SliderField({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  help,
}: SliderFieldProps): JSX.Element {
  return (
    <Box
      bg="transparent"
      borderRadius="8px"
      p="3"
      boxShadow="2px 4px 3px 0px rgba(0, 0, 0, 0.25)"
      border="1px solid rgba(255, 255, 255, 0.25)"
      _active={{
        boxShadow: "2px 4px 3px 0px rgba(0, 0, 0, 0.25) inset"
      }}
    >
      <Field
        {...settingStyles.common.field}
        label={
          <Flex align="center">
            <Text fontSize="sm" fontWeight="medium" color="gray.200" fontFamily="FZLanTingHeiS-R-GB">{label}</Text>
            {help && <HelpIcon content={help} />}
          </Flex>
        }
      >
        <Flex align="center" gap="3">
          <Box width="100px">
            <Slider
              value={[value]}
              onValueChange={(details) => onChange(details.value[0])}
              min={min}
              max={max}
              step={step}
              showValue={false}
              colorPalette="cyan"
              css={{
                '& [data-part="track"]': {
                  height: '2px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(189, 189, 189, 0.8)',
                },
                '& [data-part="range"]': {
                  backgroundColor: 'rgba(189, 189, 189, 0.8)',
                },
                '& [data-part="thumb"]': {
                  width: '7.582275390625px',
                  height: '7.582275390625px',
                  backgroundColor: 'rgba(71, 210, 229, 1)',
                  borderRadius: '50%',
                  border: 'none',
                  boxShadow: 'none',
                  outline: 'none',
                },
                '& [data-part="thumb"]:focus': {
                  outline: 'none',
                  boxShadow: 'none',
                }
              }}
            />
          </Box>
          <Text fontSize="sm" color="gray.200" minW="30px" textAlign="right">
            {value}
          </Text>
        </Flex>
      </Field>
    </Box>
  );
}