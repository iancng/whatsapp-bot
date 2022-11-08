import fetch from 'node-fetch';
import { XMLParser, XMLBuilder, XMLValidator} from "fast-xml-parser";

const response = await fetch('https://www.td.gov.hk/tc/special_news/trafficnews.xml');
const parser = new XMLParser();
const XMLdata = await response.text();
const XMLobject = parser.parse(XMLdata);
const data = XMLobject.list.message;

console.log(data);