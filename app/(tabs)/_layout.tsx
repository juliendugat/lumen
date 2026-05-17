import { Tabs } from 'expo-router';
import { useTheme } from '@/ui/ThemeProvider';
import { TabIcon } from '@/ui/icons/TabIcon';
import { useCycle } from '@/store/cycle';

export default function TabsLayout() {
  const t = useTheme();
  // Learn tab follows the *voice* axis (teen-voice users see explainers),
  // not the life-stage axis. A pregnant teen still gets the Learn tab.
  const voice = useCycle((s) => s.settings?.voice ?? 'adult');
  const showLearn = voice === 'teen';
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.palette.ink,
        tabBarInactiveTintColor: t.palette.inkFaint,
        tabBarStyle: {
          backgroundColor: t.palette.paper,
          borderTopColor: t.palette.paperEdge,
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          letterSpacing: 0.4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => <TabIcon name="ring" color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => <TabIcon name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color }) => <TabIcon name="chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          href: showLearn ? undefined : null,
          tabBarIcon: ({ color }) => <TabIcon name="book" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon name="gear" color={color} />,
        }}
      />
    </Tabs>
  );
}
