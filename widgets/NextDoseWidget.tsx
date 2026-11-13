import { Text, VStack, HStack } from '@expo/ui/swift-ui';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type NextDoseWidgetProps = {
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  todayTaken: number;
  todayTotal: number;
};

const NextDoseWidget = (
  props: NextDoseWidgetProps,
  _environment: WidgetEnvironment
) => {
  'widget';

  const hasNextDose = props.medicationName.length > 0;
  const progress =
    props.todayTotal > 0
      ? `${props.todayTaken}/${props.todayTotal}`
      : '—';

  return (
    <VStack>
      <Text>💊 MediBuddy</Text>
      {hasNextDose ? (
        <VStack>
          <Text>{props.medicationName}</Text>
          <HStack>
            <Text>⏰ {props.scheduledTime}</Text>
            {props.dosage ? <Text>{props.dosage}</Text> : null}
          </HStack>
        </VStack>
      ) : (
        <Text>No upcoming doses today ✓</Text>
      )}
      <Text>Today: {progress} done</Text>
    </VStack>
  );
};

export default createWidget('NextDoseWidget', NextDoseWidget, {
  medicationName: '',
  dosage: '',
  scheduledTime: '',
  todayTaken: 0,
  todayTotal: 0,
});
