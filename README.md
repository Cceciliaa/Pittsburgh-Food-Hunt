# Pittsburgh-Food-Hunt
There are a lot of restaurants in Pittsburgh but it is hard to find the “best” places to eat when searching online. To better understand the food scene in Pittsburgh, we are interested to show the different types of restaurants on map and sort the restaurant in different rating criteria to help people find the top ranking restaurants to eat in Pittsburgh.

## Views and Interactions
There are three major views: a geometric map view, a line chart glyph view, and a stacked bar-chart view. The interactions among three views are linked.    

Screenshot of the general view is as below:                
![alt text](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F65d89213-4205-4a75-ae1f-32b840ca0ef4%2FScreen_Shot_2021-05-04_at_10.16.30_AM.png?table=block&id=2516236e-068a-45f7-a002-c75679e40aa3&width=2880&userId=6de819c4-42ee-4bff-90ed-21cc836a2fd0&cache=v2)

When the user hovers over a point on the map, a glyph showing the information for the corresponding restaurant will appear on the left bottom corner of the window, along with the detailed information about the selected restaurant in text, and the stacked bar chart will show information for top 10 restaurants of the same category
to the selected restaurant.

When the user clicks on a category of the restaurant on the legend, the points of the same category on the map will be filtered out and pop up, while others will be hidden behind. Users can then hover over the popped up points to check for information of specific restaurants of his/her desired category (the one selected on the legend). Meanwhile, the bar chart will also show information of the top 10 restaurants of the selected category.

On the other hand, when the user hover over the bar chart, the corresponding restaurant will pop up on the map, and its information will show on the left hand side.

In addition, we generated a Word cloud, which is a view for fun. We use size channels to encode the frequency of each category. When the user clicks on one word, for example, bars, they will be redirected to Google search for “Pittsburgh bars”.

## Data Sources
- i. Business, review_total:
https://www.kaggle.com/yelp-dataset/yelp-dataset?select=yelp_academic_datas
- ii. Pittsburgh_2014_CDBG_Census_Tracts
https://catalog.data.gov/dataset/pittsburgh-neighborhoods-map
- iii. Pittsburgh_park
https://data.wprdc.org/dataset/pittsburgh-parks
