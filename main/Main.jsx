import "./MainStyle";
import {NavigationContainer} from "@react-navigation/native";
import Home from "./Component/Home";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Library from "./Component/Library";
import ky from "ky";
export function main(){

    const Tab = createBottomTabNavigator();
    const parser = require('react-native-html-parser').DOMParser;

    const scrapeWithHtmlParser = async (url) => {
        try {
            const response = await ky(url);
            const html = await response.text();

            const doc = new parser().parseFromString(html,'text/html');

            // Extract title
            const titleElements = doc.getElementsByTagName('title');
            const title = titleElements.length > 0 ? titleElements[0].textContent : '';

            // Extract h1 headings
            const h1Elements = doc.getElementsByTagName('h1');
            const headings = Array.from(h1Elements).map(el => el.textContent);

            // Extract links
            const linkElements = doc.getElementsByTagName('a');
            const links = Array.from(linkElements).map(el => ({
                text: el.textContent,
                href: el.getAttribute('href')
            }));

            return { title, headings, links };
        } catch (error) {
            console.error('Scraping failed:', error);
            return null;
        }
    };
    //Use this later https://www.npmjs.com/package/react-native-render-html
    scrapeWithHtmlParser("https://archiveofourown.org/").then(data => {
        console.log(data);
    });

    return (
        <NavigationContainer>
            <Tab.Navigator>
                <Tab.Screen name="Home" component={Home} />
                <Tab.Screen name="Profile" component={Library} />
            </Tab.Navigator>
        </NavigationContainer>
    );
}