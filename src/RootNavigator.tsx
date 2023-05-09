import * as React from 'react';
import { Appbar } from 'react-native-paper';

import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { getHeaderTitle } from '@react-navigation/elements';
import { createStackNavigator } from '@react-navigation/stack';

import ExampleList, { examples } from './ExampleList';

const Stack = createStackNavigator();

export default function Root(): JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => {
        return {
          detachPreviousScreen: !navigation.isFocused(),
          header: ({ navigation, route, options, back }): React.ReactNode => {
            const title = getHeaderTitle(options, route.name);
            
            return (
              <Appbar.Header elevated>
                {back 
                  ? <Appbar.Action 
                    icon='chevron-left'
                    size={32}
                    onPress={() => navigation.goBack()} 
                  />
                  : (navigation as any).openDrawer 
                    ? <Appbar.Action
                      icon="menu"
                      isLeading
                      onPress={() =>
                        (
                          navigation as any as DrawerNavigationProp<{}>
                        ).openDrawer()
                      }
                    />
                    : null
                }
                <Appbar.Content title={title} />
              </Appbar.Header>
            );
          },
        };
      }}
    >
      <Stack.Screen
        name="ExampleList"
        component={ExampleList}
        options={{ title: 'Examples' }}
      />

      {(Object.keys(examples) as Array<keyof typeof examples>).map(id => {
        return (
          <Stack.Screen
            key={id}
            name={id}
            component={examples[id]}
            options={{
              title: examples[id].title,
              headerShown: id !== 'themingWithReactNavigation',
            }}
          />
        );
      })}
    </Stack.Navigator>
  );
}
