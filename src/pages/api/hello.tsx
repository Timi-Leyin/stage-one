import { NextRequest, NextResponse } from "next/server";
import * as requestIp from "request-ip";

import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

type HourlyUnits = { time: string; temperature_2m: string };
type Hourly = {
  temperature_2m: string[];
};
export interface GetLocationT {
  ip: string;
  latitude: string;
  longitude: string;
  city: string;
  region: string;
  hourly: Hourly;
  hourly_units?: HourlyUnits;
}

export class ClientLocation {
  constructor(
    private locationUrl = "https://get.geojs.io/v1/ip/geo/",
    private tempUrl = "https://api.open-meteo.com/v1/forecast "
  ) {}
  async getLocation(ip: string): Promise<GetLocationT | null> {
    try {
      const response = await axios.get(`${this.locationUrl}${ip}.json`);
      const temp = await this.getTemperature({
        latitude: response.data.latitude,
        longitude: response.data.latitude,
      });
      return {
        ...response.data,
        ...temp,
      };
    } catch (error) {
      return null;
    }
  }

  async getTemperature({ longitude, latitude }: any) {
    try {
      const temp = await axios.get(this.tempUrl, {
        params: {
          latitude,
          longitude,
          hourly: "temperature_2m",
        },
      });
      return temp.data;
    } catch (error) {
      return;
    }
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { visitor_name } = req.query;
  //   @ts-ignore
  const name = (visitor_name || "Guest").replace(/\"|\'/gi, "");
  const ip = requestIp.getClientIp(req);
  const clientIp = ip || "102.89.47.25";
  const clientLocation = new ClientLocation();

  const $location = await clientLocation.getLocation(clientIp);

  const temp =
    $location && $location.hourly ? $location.hourly.temperature_2m[0] : "N/A";
  const location = $location?.city || "Unknown";
  const response = {
    client_ip: clientIp,
    location,
    greeting: `Hello, ${name}!, the temperature is ${temp} degrees Celsius in ${location}`,
  };

  return res.json(response);
}
