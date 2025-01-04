import { SettingsLimits } from '../../types/settings_limits';
export type DefaultSettingsCmd = {
    params: Record<string, never>;
    response: {
        DefaultSettings: SettingsLimits;
    };
};
