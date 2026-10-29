// Matchers de @testing-library/jest-dom (toBeDisabled, toHaveAccessibleName…)
import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// react-router v7 los usa y el jsdom de Jest 27 no los trae
Object.assign(global, { TextEncoder, TextDecoder });
