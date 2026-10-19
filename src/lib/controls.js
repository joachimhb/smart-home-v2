// 'http://raspi-arbeitszimmer/api/'
const apiBase = '/api/';

import client from './client';

export const updateShutterMovement = async(room, shutter, value) => {
  const url = `${apiBase}rooms/${room}/shutter/${shutter}/movement`;

  await client.put(url, {value});
};

export const updateShutterValue = async(room, shutter, value) => {
  const url = `${apiBase}rooms/${room}/shutter/${shutter}/value`;

  await client.put(url, {value});
};

export const updateButtonActive = async(room, switchId, value) => {
  const url = `${apiBase}rooms/${room}/button/${switchId}/active`;

  await client.put(url, {value});
};

export const setShutterMoveTo = async(room, shutter, value) => {
  const url = `${apiBase}rooms/${room}/shutter/${shutter}/moveTo`;

  await client.put(url, {value});
};

export const updateFanControl = async(room, fan, value) => {
  const url = `${apiBase}rooms/${room}/fan/${fan}/control`;

  await client.put(url, {value});
};

export const updateFanSpeed = async(room, fan, value) => {
  const url = `${apiBase}rooms/${room}/fan/${fan}/speed`;

  await client.put(url, {value});
};

export const updateFanConfigValue = async(room, fan, configKey, value) => {
  const url = `${apiBase}rooms/${room}/fan/${fan}/${configKey}`;

  await client.put(url, {value});
};

export const updateLightStatus = async(room, lightId, value) => {
  const url = `${apiBase}rooms/${room}/light/${lightId}/status`;

  await client.put(url, {value});
};

export const updateSwitchState = async(room, manufacturer, switchId, state) => {
  const url = `${apiBase}rooms/${room}/switch/${manufacturer}/${switchId}/state`;

  await client.put(url, {state});
};

export const triggerHeatingBoost = async(room, value) => {
  const url = `${apiBase}rooms/${room}/heating/boost`;

  await client.post(url, {value});
};

export const triggerHeatingPause = async(room, value) => {
  const url = `${apiBase}rooms/${room}/heating/pause`;

  await client.post(url, {value});
};

export const updateHeatingMode = async(room, value) => {
  const url = `${apiBase}rooms/${room}/heating/mode`;

  await client.put(url, {value});
};

export const updateHeatingTemperature = async(room, value) => {
  const url = `${apiBase}rooms/${room}/heating/temperature`;

  await client.put(url, {value});
};
